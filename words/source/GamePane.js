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
  function importLibrary(filename) {
    importScripts(resolver(`GamePane/${filename}`));
  }
  importLibrary('Dictionary.js');
  importLibrary('Scoring.js');
  importLibrary('Tile.js');
  importLibrary('TileBoard.js');

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
   [${host}] .gameInfo {
     font-size: 1.2em;
     font-variant-caps: all-small-caps;
     padding-bottom: 0.5em;
   }
   [${host}] .board {
     height: 356px;
     width: 356px;
     position: relative;
     user-select: none;
     -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
   }
   [${host}] .board .tile {
     background-color: wheat;
     border-radius: 3px;
     color: black;
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
     color: #cc6600;
   }
   [${host}] .board .selected,
   [${host}] .board .selected .points {
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
   <div class="loadingDictionary" hidden="{{hideDictionaryLoading}}">
     Loading dictionary&hellip;
   </div>
   <div class="gameInfo" hidden="{{hideGameInfo}}">
     <div class="score">Score: <span>{{score}}</span></div>
     <div class="move">Move: <span>{{move}}</span></div>
     <div class="longestWord">Longest word: <span>{{longestWord}}</span></div>
     <div class="highestScoringWord">Highest scoring word: <span>{{highestScoringWord}}</span></div>
     <div class="shuffle">Shuffles Remaining: <span>{{shuffleAvailableCount}}</span></div>
     <div>
       <button disabled="{{submitMoveDisabled}}" on-click="_onSubmitMove">Submit Move</button>
       <button style%="padding-left: 2em" on-click="_onShuffle">Shuffle</button>
     </div>
   </div>
   <div class="board"><span>{{boardCells}}</span><span>{{annotations}}</span></div>
 </div>
 <template board-cell>
   <div class="{{classes}}" style%="{{style}}" on-mousedown="_onTileMouseDown" on-mouseup="_onTileMouseUp" on-mouseover="_onTileMouseOver" value="{{index}}">
     <span>{{letter}}</span><div class="points">{{points}}</div>
   </div>
 </template>
 <template annotation>
   <div class="annotation" style%="{{style}}">{{content}}</div>
 </template>
      `.trim();

  const DICTIONARY_URL =
    'https://raw.githubusercontent.com/shaper/shaper.github.io/master/resources/words-dictionary.txt';

  const info = console.log.bind(
    console.log,
    '%cGamePane',
    `background: #ff69b4; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
  );

  return class extends DomParticle {
    get template() {
      return template;
    }
    _boardToModels(tileBoard, coordinates) {
      let models = [];
      for (let i = 0; i < tileBoard.size; i++) {
        const tile = tileBoard.tileAtIndex(i);
        const letterClasses = ['tile'];
        let yPixels = tile.y * 50 + tile.y;
        if (tile.isShiftedDown) yPixels += 25;
        if (coordinates.indexOf(`(${tile.x},${tile.y})`) != -1)
          letterClasses.push('selected');
        models.push({
          letter: tile.letter,
          points: Scoring.pointsForLetter(tile.letter),
          index: i,
          style: `top: ${yPixels}px; left: ${tile.x * 50 + tile.x}px;`,
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
      const particleRef = this;
      const startstamp = performance.now();
      fetch(DICTIONARY_URL).then(response =>
        response.text().then(text => {
          const dictionary = new Dictionary(text);
          const endstamp = performance.now();
          const elapsed = Math.floor(endstamp - startstamp);
          info(
            `Loaded dictionary [time=${elapsed}ms, wordCount=${
              dictionary.size
            }].`
          );
          particleRef._setState({ dictionary: dictionary });
        })
      );
    }
    _tilesToWord(tiles) {
      return tiles.map(t => t.letter).join('');
    }
    _processSubmittedMove(props, state, tileBoard) {
      let moveData = props.move ? props.move.rawData : { coordinates: '' };
      let moveTiles = this._moveToTiles(tileBoard, props.move);
      let score = 0;
      if (!state.dictionary || !state.moveSubmitted)
        return [moveData, moveTiles, score];
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
          this._setStats(Scoring.applyMoveStats(props.stats, word, score));
          this._setBoard({
            letters: tileBoard.toString,
            shuffleAvailableCount: tileBoard.shuffleAvailableCount
          });
        }
      }
      moveData = { coordinates: '' };
      this._setMove(moveData);
      moveTiles = [];
      return [moveData, moveTiles, score];
    }
    _willReceiveProps(props, state) {
      // info('willReceiveProps [props=', props, 'state=', state, '].');
      this._ensureDictionaryLoaded(state);
      if (!props.board) this._setBoard(TileBoard.create());
      if (!props.stats) this._setStats(Scoring.create());
      const tileBoard = new TileBoard(props.board);
      let [moveData, moveTiles, moveScore] = this._processSubmittedMove(
        props,
        state,
        tileBoard
      );
      this._setState({
        tileBoard: tileBoard,
        move: moveData,
        selectedTiles: moveTiles,
        moveScore: Scoring.wordScore(moveTiles),
        score: props.stats ? props.stats.score : 0,
        moveSubmitted: false
      });
    }
    _topPixelForHorizontalTransition(fromTile, toTile) {
      let topPixel = fromTile.y * 50 + 18 + fromTile.y;
      if (fromTile.isShiftedDown) {
        topPixel += 25;
        if (toTile.y == fromTile.y) topPixel -= 12;
        else topPixel += 12;
      } else {
        if (toTile.y == fromTile.y) topPixel += 12;
        else topPixel -= 12;
      }
      return topPixel;
    }
    _tileTransitionToTextAndPosition(fromTile, toTile) {
      // A sad hard-coded pixel positioned hack. Rework to use alignment with
      // the involved tile position.
      let contentText, positionText;
      if (toTile.x > fromTile.x) {
        contentText = '→';
        const tilesFromRight = BOARD_WIDTH - fromTile.x - 1;
        let topPixel = this._topPixelForHorizontalTransition(fromTile, toTile);
        positionText = `top: ${topPixel}px; right: ${tilesFromRight * 50 +
          tilesFromRight -
          9}px;`;
      } else if (toTile.x < fromTile.x) {
        contentText = '←';
        let topPixel = this._topPixelForHorizontalTransition(fromTile, toTile);
        positionText = `top: ${topPixel}px; left: ${fromTile.x * 50 +
          fromTile.x -
          9}px;`;
      } else if (toTile.y > fromTile.y) {
        contentText = '↓';
        let topPixel = (fromTile.y + 1) * 50 - 7 + fromTile.y;
        if (fromTile.isShiftedDown) topPixel += 25;
        positionText = `top: ${topPixel}px; left: ${fromTile.x * 50 +
          fromTile.x +
          22}px;`;
      } else {
        contentText = '↑';
        let topPixel = fromTile.y * 50 - 9 + fromTile.y;
        if (fromTile.isShiftedDown) topPixel += 25;
        positionText = `top: ${topPixel}px; left: ${fromTile.x * 50 +
          fromTile.x +
          22}px;`;
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
      if (!state.tileBoard)
        return {
          hideDictionaryLoading: false,
          hideGameInfo: true
        };
      let boardModels = this._boardToModels(
        state.tileBoard,
        state.move ? state.move.coordinates : ''
      );
      let annotationModels = this._selectedTilesToModels(state.selectedTiles);
      const word = this._tilesToWord(state.selectedTiles);
      const moveText = `${word} (${Scoring.wordScore(state.selectedTiles)})`;
      const submitMoveEnabled =
        Scoring.isMinimumWordLength(state.selectedTiles.length) &&
        state.dictionary.contains(word);
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
        longestWord: Scoring.longestWordText(props.stats),
        highestScoringWord: Scoring.highestScoringWordText(props.stats),
        shuffleAvailableCount: state.tileBoard.shuffleAvailableCount,
        score: `${state.score} (${
          props.stats ? props.stats.moveCount : 0
        } moves)`,
        submitMoveDisabled: !submitMoveEnabled,
        hideDictionaryLoading: true,
        hideGameInfo: false
      };
    }
    _onTileMouseDown(e, state) {
      state.lastTileMoused = e.data.value;
      this._selectTile(e, state);
    }
    _onTileMouseUp(e, state) {
      state.lastTileMoused = null;
      this._setState({
        lastTileMoused: state.lastTileMoused
      });
    }
    _onTileMouseOver(e, state) {
      if (state.lastTileMoused && state.lastTileMoused != e.data.value) {
        state.lastTileMoused = e.data.value;
        this._selectTile(e, state);
      }
    }
    _selectTile(e, state) {
      const tile = state.tileBoard.tileAtIndex(e.data.value);
      let lastSelectedTile =
        state.selectedTiles.length == 0
          ? undefined
          : state.selectedTiles[state.selectedTiles.length - 1];
      // info(
      //   `_selectTile [tile=${tile.toString}, lastSelectedTile=${
      //     lastSelectedTile ? lastSelectedTile.toString : 'undefined'
      //   }].`
      // );
      if (!state.tileBoard.isMoveValid(state.selectedTiles, tile)) return;
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
      // TODO(wkorman): Consider making Move purely state.
      this._setMove({ coordinates: newCoordinates });
      this._setState({
        move: state.move,
        lastTileMoused: state.lastTileMoused,
        selectedTiles: state.selectedTiles
      });
    }
    _onSubmitMove(e, state) {
      this._setState({ moveSubmitted: true });
    }
    _onShuffle(e, state) {
      info(`Shuffling [remaining=${state.tileBoard.shuffleAvailableCount}].`);
      if (state.tileBoard.shuffle()) {
        this._setBoard({
          letters: state.tileBoard.toString,
          shuffleAvailableCount: state.tileBoard.shuffleAvailableCount
        });
      }
    }
    _setMove(values) {
      this._setView('move', values);
    }
    _setBoard(values) {
      this._setView('board', values);
    }
    _setStats(values) {
      this._setView('stats', values);
    }
    _setView(name, values) {
      const view = this._views.get(name);
      view.set(new view.entityClass(values));
    }
  };
});
