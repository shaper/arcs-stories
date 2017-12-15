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
  importScripts(resolver('MovePicker/Scoring.js'));
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
   [${host}] .move {
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
   [${host}] .board .annotation {
     position: absolute;
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
   <div class="board"><span>{{boardCells}}</span><span>{{annotations}}</span></div>
 </div>
 <template board-cell>
   <div class="{{classes}}" style%="{{style}}" on-click="_onTileClicked" value="{{index}}">
     <span>{{letter}}</span><div class="points">{{points}}</div>
   </div>
 </template>
 <template annotation>
   <div class="annotation" style%="{{style}}">{{content}}</div>
 </template>
      `.trim();

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
    _boardToModels(tileBoard, coordinates) {
      let models = [];
      for (let i = 0; i < tileBoard.size; i++) {
        let tile = tileBoard.tileAtIndex(i);
        let letterClasses = ['tile'];
        if (coordinates.indexOf(`(${tile.x},${tile.y})`) != -1)
          letterClasses.push('selected');
        models.push({
          letter: tile.letter,
          points: Scoring.pointsForLetter(tile.letter),
          index: i,
          style: `top: ${tile.y * 50 + tile.y}px; left: ${tile.x * 50 +
            tile.x}px;`,
          classes: letterClasses.join(' ')
        });
      }
      return models;
    }
    _moveToTiles(tileBoard, move) {
      let tiles = [];
      if (!tileBoard || !move || !move.coordinates) return tiles;
      // TODO(wkorman): If move coordinates were stored as a list of x/y tuples
      // this would be much simpler.
      const tuples = move.coordinates.match(/(\d+,\d+)/g);
      for (let i = 0; i < tuples.length; i++) {
        const parts = tuples[i].split(',');
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        tiles.push(tileBoard.tileAt(x, y));
      }
      return tiles;
    }
    _ensureDictionaryLoaded(state) {
      if (state.dictionaryLoadingStarted) return;

      this._setState({ dictionaryLoadingStarted: true });
      let particleRef = this;
      let startstamp = performance.now();
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
    _processSubmittedMove(props, state, tileBoard) {
      let moveData = props.move ? props.move.rawData : { coordinates: '' };
      let moveTiles = this._moveToTiles(tileBoard, props.move);
      let score = 0;
      if (state.moveSubmitted) {
        const word = this._tilesToWord(moveTiles);
        if (!Scoring.isMinimumWordLength(moveTiles.length)) {
          info(`Word is too short [word=${word}].`);
        } else {
          let isInDictionary = state.dictionary.contains(word);
          if (!isInDictionary) {
            info(`Word is not in dictionary [word=${word}].`);
          } else {
            score = Scoring.wordScore(moveTiles);
            info(`Scoring word [word=${word}, score=${score}].`);
            tileBoard.applyMove(moveTiles);
            this._setStats(
              props.stats.score + score,
              props.stats.moveCount + 1
            );
            this._setBoard(tileBoard.toString);
          }
        }
        this._setMove('');
        moveData = { coordinates: '' };
        moveTiles = [];
      }
      return [moveData, moveTiles, score];
    }
    _generateBoard() {
      let boardChars = '';
      for (let i = 0; i < TILE_COUNT; i++)
        boardChars += TileBoard.pickCharWithFrequencies();
      this._setBoard(boardChars);
    }
    _generateStats() {
      this._setStats(0, 0);
    }
    _willReceiveProps(props, state) {
      // info('willReceiveProps [props=', props, 'state=', state, '].');
      this._ensureDictionaryLoaded(state);
      if (!props.board) this._generateBoard();
      if (!props.stats) this._generateStats();
      if (!state.dictionary) return;
      let tileBoardState = new TileBoard(props.board);
      let [moveData, moveTiles, moveScore] = this._processSubmittedMove(
        props,
        state,
        tileBoardState
      );
      let moveState = Object.assign({}, moveData);
      this._setState({
        tileBoard: tileBoardState,
        move: moveState,
        selectedTiles: moveTiles,
        moveScore: Scoring.wordScore(moveTiles),
        score: props.stats.score,
        moveSubmitted: false
      });
    }
    _tileTransitionToTextAndPosition(fromTile, toTile) {
      // A sad hard-coded pixel positioned hack. Rework to use alignment with
      // the involved tile position.
      let contentText, positionText;
      if (toTile.x > fromTile.x) {
        contentText = '→';
        let tilesFromRight = BOARD_WIDTH - fromTile.x - 1;
        positionText = `top: ${fromTile.y * 50 +
          18 +
          fromTile.y}px; right: ${tilesFromRight * 50 + tilesFromRight - 9}px;`;
      } else if (toTile.x < fromTile.x) {
        contentText = '←';
        positionText = `top: ${fromTile.y * 50 +
          18 +
          fromTile.y}px; left: ${fromTile.x * 50 + fromTile.x - 9}px;`;
      } else if (toTile.y > fromTile.y) {
        contentText = '↓';
        positionText = `top: ${(fromTile.y + 1) * 50 -
          7 +
          fromTile.y}px; left: ${fromTile.x * 50 + fromTile.x + 22}px;`;
      } else {
        contentText = '↑';
        positionText = `top: ${fromTile.y * 50 -
          9 +
          fromTile.y}px; left: ${fromTile.x * 50 + fromTile.x + 22}px;`;
      }
      return [contentText, positionText];
    }
    _selectedTilesToModels(selectedTiles) {
      let models = [];
      if (selectedTiles.length < 2) return models;
      for (let i = 0; i < selectedTiles.length - 1; i++) {
        let [contentText, positionText] = this._tileTransitionToTextAndPosition(
          selectedTiles[i],
          selectedTiles[i + 1]
        );
        models.push({
          style: positionText,
          content: contentText
        });
      }
      return models;
    }
    _render(props, state) {
      // info('render [props=', props, 'state=', state, '].');
      if (!state.tileBoard || !state.move) return {};
      let boardModels = this._boardToModels(
        state.tileBoard,
        state.move.coordinates
      );
      let annotationModels = this._selectedTilesToModels(state.selectedTiles);
      const word = this._tilesToWord(state.selectedTiles);
      const moveText = `${word} (${Scoring.wordScore(state.selectedTiles)})`;
      return {
        annotations: {
          $template: 'annotation',
          models: annotationModels
        },
        boardCells: {
          $template: 'board-cell',
          models: boardModels
        },
        move: moveText,
        score: `${state.score} (${props.stats.moveCount} moves)`
      };
    }
    _onTileClicked(e, state) {
      const tile = state.tileBoard.tileAtIndex(e.data.value);
      let lastSelectedTile =
        state.selectedTiles.length == 0
          ? undefined
          : state.selectedTiles[state.selectedTiles.length - 1];
      // info(
      //   `_onTileClicked [tile=${tile.toString}, lastSelectedTile=${
      //     lastSelectedTile ? lastSelectedTile.toString : 'undefined'
      //   }].`
      // );
      if (!state.tileBoard.isMoveValid(state.move, state.selectedTiles, tile)) {
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
        move: state.move,
        selectedTiles: state.selectedTiles
      });
    }
    _onSubmitMove(e, state) {
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
    _setStats(newScore, newMoveCount) {
      let newStats = Object.assign(
        {},
        { score: newScore, moveCount: newMoveCount }
      );
      const stats = this._views.get('stats');
      stats.set(new stats.entityClass(newStats));
    }
  };
});
