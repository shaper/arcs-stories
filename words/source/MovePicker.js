/**
 * @license
 * Copyright (c) 2017 Google Inc. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * Code distributed by Google as part of this project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
'use strict';

defineParticle(({ DomParticle }) => {
  let host = `move-picker`;

  let styles = `
 <style>
   [${host}] {
     padding: 5px;
   }
   [${host}] .boardWrapper {
     cursor: pointer;
     display: grid;
     grid-template-columns: repeat(7, 50px);
     grid-gap: 1px;
     align-items: center;
     justify-items: center;
     user-select: none;
   }
   [${host}] .boardWrapper div {
     background-color: wheat;
     border-radius: 3px;
     color: brown;
     text-align: center;
     font: sans-serif;
     line-height: 50px;
     width: 50px;
     height: 50px;
   }
   [${host}] .boardWrapper div.selected {
     background-color: goldenrod;
     color: white;
   }
 </style>
   `;

  let template = `
 ${styles}
 <div ${host}>
   <div>
    <div class="boardWrapper">{{boardCells}}</div>
   </div>
   Move: <span>{{move}}</span>
   <div><button on-click="_onSubmitMove">Submit Move</button></div>
 </div>
 <template board-cell>
   <div class="{{classes}}" on-click="_onTileClicked" value="{{index}}">{{letter}}</div>
 </template>
      `.trim();

  // TODO(wkorman): Share these with board generator somehow.
  let BOARD_HEIGHT = 7;
  let BOARD_WIDTH = 7;

  let info = console.log.bind(
    console.log,
    '%cMovePicker',
    `background: #ff69b4; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
  );

  // A specific tile on the board with an index, position and character.
  class Tile {
    constructor(charIndex, board) {
      this._charIndex = charIndex;
      this._letter = board.letters[charIndex];
      this._x = charIndex % BOARD_WIDTH;
      this._y = Math.floor(charIndex / BOARD_HEIGHT);
    }
    get charIndex() {
      return this._charIndex;
    }
    get letter() {
      return this._letter;
    }
    get x() {
      return this._x;
    }
    get y() {
      return this._y;
    }
    get toString() {
      return `[charIndex=${this.charIndex}, letter=${this.letter}, x=${
        this.x
      }, y=${this.y}]`;
    }
  }

  // A simple dictionary class to encapsulate the set of words that are
  // considered valid for game purposes.
  class Dictionary {
    // Expects words to be provided as a return-delimited string.
    constructor(words) {
      // TODO(wkorman): Use a trie for better memory efficiency and ship a
      // more compact dictionary representation over the wire. Also, strip
      // proper nouns and words with apostrophes.
      this._dict = new Set();
      for (const wordEntry of words.split('\n')) {
        const trimmedWord = wordEntry.trim();
        if (trimmedWord.length > 0) this._dict.add(trimmedWord);
      }
    }
    contains(word) {
      return this._dict.has(word);
    }
    get size() {
      return this._dict.size;
    }
  }

  return class extends DomParticle {
    get template() {
      return template;
    }
    _boardToModels(board, coordinates) {
      let models = [];
      // TODO(wkorman): Rework this to use tiles.
      for (let i = 0; i < board.length; i++) {
        let x = i % BOARD_WIDTH;
        let y = Math.floor(i / BOARD_WIDTH);
        let letterClasses =
          coordinates.indexOf(`(${x},${y})`) != -1 ? 'selected' : '';
        models.push({ letter: board[i], index: i, classes: letterClasses });
      }
      return models;
    }
    _moveToTiles(board, move) {
      let tiles = [];
      if (!board || !move || !move.coordinates) return tiles;
      let tuples = move.coordinates.match(/(\d+,\d+)/g);
      for (let i = 0; i < tuples.length; i++) {
        let parts = tuples[i].split(',');
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        tiles.push(new Tile(y * BOARD_WIDTH + x, board));
      }
      return tiles;
    }
    _willReceiveProps(props, state) {
      if (!state.dictionaryLoadingStarted) {
        let particleRef = this;
        // TODO(wkorman): Replace this with our own hosted dictionary.
        const dictionaryName =
          'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt';
        info(`Loading dictionary [name=${dictionaryName}].`);
        fetch(dictionaryName).then(response =>
          response.text().then(text => {
            let dictionary = new Dictionary(text);
            info(`Loaded dictionary [wordCount=${dictionary.size}].`);
            particleRef._setState({ dictionaryLoaded: true });
          })
        );
        this._setState({ dictionaryLoadingStarted: true });
      }

      // Nothing to do if we've not yet got a board.
      if (!props.board || !state.dictionaryLoaded) return;

      // TODO(wkorman): Check flag for whether the current move has been
      // submitted. If so, we'll want to either directly mutate the board before
      // setting it into the particle state; or, set additional info to allow
      // render to mutate things.

      // Copy the board and move into the particle state, and generate
      // a list of Tile instances representing the currently selected
      // tiles in the move, if any.
      this._setState({
        board: Object.assign({}, props.board.rawData),
        move: Object.assign(
          {},
          props.move ? props.move.rawData : { coordinates: '' }
        ),
        selectedTiles: this._moveToTiles(props.board, props.move),
        dictionaryLoadingStarted: true,
        dictionaryLoaded: true
      });
    }
    _render(props, state) {
      if (!state.board || !state.move) return {};
      let boardModels = this._boardToModels(
        state.board.letters,
        state.move.coordinates
      );
      return {
        boardCells: {
          $template: 'board-cell',
          models: boardModels
        },
        move: state.move.coordinates
      };
    }
    _tileArrayContainsTile(tileArray, tile) {
      for (let i = 0; i < tileArray.length; i++) {
        if (tileArray[i].x == tile.x && tileArray[i].y == tile.y) return true;
      }
      return false;
    }
    _isMoveValid(move, selectedTiles, tile) {
      // Initial moves are considered valid.
      if (
        !move.coordinates ||
        move.coordinates.length == 0 ||
        selectedTiles.length == 0
      )
        return true;
      // Selecting the last selected tile is permitted so as to de-select.
      let lastSelectedTile = selectedTiles[selectedTiles.length - 1];
      if (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y)
        return true;
      // Else the new selection must touch the last selection and can't
      // already be selected.
      let touchesLastSelectedTile =
        (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y - 1) ||
        (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y + 1) ||
        (lastSelectedTile.x == tile.x - 1 && lastSelectedTile.y == tile.y) ||
        (lastSelectedTile.x == tile.x + 1 && lastSelectedTile.y == tile.y);
      return (
        touchesLastSelectedTile &&
        !this._tileArrayContainsTile(selectedTiles, tile)
      );
    }
    _onTileClicked(e, state) {
      let tile = new Tile(e.data.value, state.board);
      let charIndex = e.data.value;
      let lastSelectedTile =
        state.selectedTiles.length == 0
          ? undefined
          : state.selectedTiles[state.selectedTiles.length - 1];
      info(
        `_onTileClicked [tile=${tile.toString}, lastSelectedTile=${
          lastSelectedTile ? lastSelectedTile.toString : 'undefined'
        }].`
      );
      if (!this._isMoveValid(state.move, state.selectedTiles, tile)) {
        info(`Ignoring selection of invalid tile [tile=${tile.toString}].`);
        return;
      }
      let newCoordinates = '';
      if (
        lastSelectedTile &&
        lastSelectedTile.x == tile.x &&
        lastSelectedTile.y == tile.y
      ) {
        // User clicked on same tile last clicked, so de-select it.
        state.selectedTiles.pop();
        // We could pop the last tuple but it's easier to just rebuild,
        // and hopefully we'll move away from a string tuple hack soon.
        for (let i = 0; i < state.selectedTiles.length; i++) {
          if (i > 0) newCoordinates += ',';
          let buildTile = state.selectedTiles[i];
          newCoordinates += `(${buildTile.x},${buildTile.y})`;
        }
      } else {
        // Append the new tile to the existing selection.
        state.selectedTiles.push(tile);
        newCoordinates = `(${tile.x},${tile.y})`;
        if (state.move.coordinates) {
          newCoordinates = `${state.move.coordinates},${newCoordinates}`;
        }
      }
      state.move.coordinates = newCoordinates;
      this._setState({
        board: state.board,
        move: state.move,
        selectedTiles: state.selectedTiles
      });
    }
    _onSubmitMove(e, state) {
      info(`Submitting move [coordinates=${state.move.coordinates}].`);
      let newMove = Object.assign({}, { coordinates: state.move.coordinates });
      const move = this._views.get('move');
      move.set(new move.entityClass(newMove));
    }
  };
});
