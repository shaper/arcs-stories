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

defineParticle(({ DomParticle, resolver }) => {
  importScripts(resolver('MovePicker/Dictionary.js'));
  importScripts(resolver('MovePicker/LetterBoard.js'));
  importScripts(resolver('MovePicker/Tile.js'));
  importScripts(resolver('MovePicker/TileBoard.js'));

  const host = `move-picker`;

  const styles = `
 <style>
   [${host}] {
     padding: 5px;
   }
   [${host}] .board {
     cursor: pointer;
     user-select: none;
   }
   [${host}] .score,
   [${host}] .move,
   [${host}] .moveScore {
     font-size: 1.2em;
     font-variant-caps: all-small-caps;
   }
   [${host}] .gameInfo {
     padding-bottom: 0.5em;
   }
   [${host}] .board {
     height: 356px;
     width: 356px;
     position: relative;
   }
   [${host}] .board .tile {
     background-color: wheat;
     border-radius: 3px;
     color: brown;
     display: inline-block;
     text-align: center;
     font: sans-serif;
     line-height: 50px;
     width: 50px;
     height: 50px;
     margin: 1px;
     position: absolute;
   }
   [${host}] .board .points {
     position: absolute;
     font-size: 0.8em;
     line-height: normal;
     top: 0.1em;
     right: 0.2em;
   }
   [${host}] .board .selected {
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
     <div class="moveScore">Move score: <span>{{moveScore}}</span></div>
     <div><button on-click="_onSubmitMove">Submit Move</button></div>
   </div>
   <div class="board">{{boardCells}}</div>
 </div>
 <template board-cell>
   <div class="{{classes}}" style%="{{style}}" on-click="_onTileClicked" value="{{index}}">
     <span>{{letter}}</span><div class="points">{{points}}</div>
   </div>
 </template>
      `.trim();

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
        let letterClasses = ['tile'];
        if (coordinates.indexOf(`(${x},${y})`) != -1)
          letterClasses.push('selected');
        models.push({
          letter: board[i],
          points: CHAR_SCORE[board[i]],
          index: i,
          style: `top: ${y * 50 + y}px; left: ${x * 50 + x}px;`,
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
        let charIndex = y * BOARD_WIDTH + x;
        tiles.push(new Tile(charIndex, board.letters[charIndex]));
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
      // TODO(wkorman): Create tile board in willReceiveProps and use it
      // elsewhere as well.
      let tileBoard = new TileBoard(props.board);
      if (state.moveSubmitted) {
        const word = this._tilesToWord(moveTiles);
        if (moveTiles.length < MINIMUM_WORD_LENGTH) {
          info(`Word is too short [word=${word}].`);
        } else {
          let isInDictionary = state.dictionary.contains(word);
          if (!isInDictionary) {
            info(`Word is not in dictionary [word=${word}].`);
          } else {
            info(`Scoring word [word=${word}, score=${score}].`);
            tileBoard.applyMove(moveTiles);
            this._setBoard(tileBoard.toString);
            score = this._wordScore(moveTiles);
          }
        }
        this._setMove('');
        moveData = { coordinates: '' };
        moveTiles = [];
      }
      return [tileBoard, moveData, moveTiles, score];
    }
    _generateBoard() {
      info('Generating board.');
      let boardChars = [];
      for (let i = 0; i < TILE_COUNT; i++)
        boardChars.push(LetterBoard.pickCharWithFrequencies());
      this._setBoard(boardChars);
    }
    _willReceiveProps(props, state) {
      // info('willReceiveProps [props=', props, 'state=', state, '].');
      this._ensureDictionaryLoaded(state);
      if (!props.board) this._generateBoard();
      if (!state.dictionary) return;
      let [
        tileBoard,
        moveData,
        moveTiles,
        moveScore
      ] = this._processSubmittedMove(props, state);
      let boardState = Object.assign({}, props.board.rawData);
      boardState.letters = tileBoard.toString;
      let moveState = Object.assign({}, moveData);
      this._setState({
        board: boardState,
        move: moveState,
        selectedTiles: moveTiles,
        moveScore: this._wordScore(moveTiles),
        score: (state.score || 0) + moveScore,
        moveSubmitted: false
      });
    }
    _render(props, state) {
      // info('render [props=', props, 'state=', state, '].');
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
        score: state.score,
        moveScore: state.moveScore
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
      let charIndex = e.data.value;
      let tile = new Tile(charIndex, state.board.letters[charIndex]);
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
      this._setMove(state.move.coordinates);
      this._setState({ moveSubmitted: true });
    }
    _setMove(newCoordinates) {
      let newMove = Object.assign({}, { coordinates: newCoordinates });
      const move = this._views.get('move');
      move.set(new move.entityClass(newMove));
    }
    _setBoard(newLetters) {
      let newBoard = Object.assign({}, { letters: newLetters });
      const board = this._views.get('board');
      board.set(new board.entityClass(newBoard));
    }
  };
});
