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
  const host = `move-picker`;

  const styles = `
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
   [${host}] .score,
   [${host}] .move  {
     font-size: 1.2em;
     font-variant-caps: all-small-caps;
   }
   [${host}] .gameInfo {
     padding-bottom: 0.5em;
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

  const template = `
 ${styles}
 <div ${host}>
   <div class="gameInfo">
     <div class="score">Score: <span>{{score}}</span></div>
     <div class="move">Move: <span>{{move}}</span></div>
     <div><button on-click="_onSubmitMove">Submit Move</button></div>
   </div>
   <div class="boardWrapper">{{boardCells}}</div>
 </div>
 <template board-cell>
   <div class="{{classes}}" on-click="_onTileClicked" value="{{index}}">{{letter}}</div>
 </template>
      `.trim();

  // TODO(wkorman): Share these with board generator somehow.
  const BOARD_HEIGHT = 7;
  const BOARD_WIDTH = 7;

  // Selected words must be at least this long for submission.
  const MINIMUM_WORD_LENGTH = 3;

  // Base score points for each character.
  const CHAR_SCORE = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 2,
    G: 2,
    H: 1,
    I: 1,
    J: 3,
    K: 3,
    L: 2,
    M: 2,
    N: 3,
    O: 1,
    P: 2,
    Q: 3,
    R: 1,
    S: 1,
    T: 1,
    U: 3,
    V: 3,
    W: 3,
    X: 3,
    Y: 3,
    Z: 3
  };

  // Multiplier applied based on word length. Tuples as (length, multiplier).
  // So 3 character words have no multiplier, 4 is 2x, etc.
  const WORD_LENGTH_MULTIPLIERS = [[3, 1], [4, 2], [6, 3], [8, 4], [12, 5]];

  const DICTIONARY_URL =
    'https://raw.githubusercontent.com/shaper/shaper.github.io/master/resources/american-english.txt';

  const info = console.log.bind(
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

  class TileBoard {
    constructor(board) {
      this._rows = [];
      let colCount = 0;
      let rowCount = 0;
      for (let i = 0; i < board.letters.length; i++) {
        if (colCount == 0) this._rows.push([]);
        this._rows[rowCount][colCount] = new Tile(i, board);
        if (colCount == BOARD_WIDTH - 1) {
          colCount = 0;
          rowCount++;
        } else {
          colCount++;
        }
      }
    }
    get toString() {
      return this._rows.map(r => r.map(c => c.letter).join('')).join('');
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
        let letterClasses = [];
        if (coordinates.indexOf(`(${x},${y})`) != -1)
          letterClasses.push('selected');
        models.push({
          letter: board[i],
          index: i,
          classes: letterClasses.join(' ')
        });
      }
      return models;
    }
    _moveToTiles(board, move) {
      let tiles = [];
      if (!board || !move || !move.coordinates) return tiles;
      // TODO(wkorman): If move coordinates were stored as a list of x/y tuples
      // this would be much simpler.
      let tuples = move.coordinates.match(/(\d+,\d+)/g);
      for (let i = 0; i < tuples.length; i++) {
        let parts = tuples[i].split(',');
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        tiles.push(new Tile(y * BOARD_WIDTH + x, board));
      }
      return tiles;
    }
    _ensureDictionaryLoaded(state) {
      if (state.dictionaryLoadingStarted) return;

      this._setState({ dictionaryLoadingStarted: true });
      let particleRef = this;
      let startstamp = performance.now();
      info(`Loading dictionary [url=${DICTIONARY_URL}].`);
      fetch(DICTIONARY_URL).then(response =>
        response.text().then(text => {
          let dictionaryState = new Dictionary(text);
          let endstamp = performance.now();
          let loadedMillis = Math.floor(endstamp - startstamp);
          info(
            `Loaded dictionary [time=${loadedMillis}ms, wordCount=${
              dictionaryState.size
            }].`
          );
          particleRef._setState({ dictionary: dictionaryState });
        })
      );
    }
    _tilesToWord(tiles) {
      return tiles
        .map(t => t.letter)
        .join('')
        .toLowerCase();
    }
    _wordLengthMultiplier(wordLength) {
      for (let i = 0; i < WORD_LENGTH_MULTIPLIERS.length; i++) {
        if (wordLength <= WORD_LENGTH_MULTIPLIERS[i][0])
          return WORD_LENGTH_MULTIPLIERS[i][1];
      }
      return WORD_LENGTH_MULTIPLIERS[WORD_LENGTH_MULTIPLIERS.length - 1][1];
    }
    _wordScore(tiles) {
      return (
        this._wordLengthMultiplier(tiles.length) *
        tiles.reduce((accumulator, t) => accumulator + CHAR_SCORE[t.letter], 0)
      );
    }
    _processSubmittedMove(props, state) {
      let moveData = props.move ? props.move.rawData : { coordinates: '' };
      let moveTiles = this._moveToTiles(props.board, props.move);
      let score = 0;
      let board = props.board.letters;
      if (state.moveSubmitted) {
        if (moveTiles.length < MINIMUM_WORD_LENGTH) {
          info('Word is too short.');
        } else {
          const word = this._tilesToWord(moveTiles);
          let isInDictionary = state.dictionary.contains(word);
          score = this._wordScore(moveTiles);
          // TODO(wkorman): Create tile board in willReceiveProps and use it
          // elsewhere as well.
          let tileBoard = new TileBoard(props.board);
          info(
            `Processing word submission [word=${word}, valid=${isInDictionary}, score=${score}].`
          );
          // TODO(wkorman): Remove the submitted tiles, shift down those above,
          // and generate new ones for the empty spaces.
        }

        moveData = { coordinates: '' };
        moveTiles = [];
      }
      return [moveData, moveTiles, score];
    }
    _willReceiveProps(props, state) {
      // info('willReceiveProps [props=', props, 'state=', state, '].');
      this._ensureDictionaryLoaded(state);
      if (!props.board || !state.dictionary) return;
      let [moveData, moveTiles, moveScore] = this._processSubmittedMove(
        props,
        state
      );
      let boardState = Object.assign({}, props.board.rawData);
      let moveState = Object.assign({}, moveData);
      this._setState({
        board: boardState,
        move: moveState,
        selectedTiles: moveTiles,
        score: (state.score || 0) + moveScore,
        moveSubmitted: false
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
        move: state.move.coordinates,
        score: state.score
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
      this._setState({ moveSubmitted: true });
    }
  };
});
