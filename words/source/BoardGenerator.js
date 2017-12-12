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
  let host = `board-generator`;

  let template = `
  <div ${host}>
    <div hidden="{{complete}}" style="padding: 10px 6px">Generating board...</div>
    <div slotid="pickmove"></div>
  </div>
    `.trim();

  let info = console.log.bind(
    console.log,
    '%cBoardGenerator',
    `background: #ee82ee; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
  );

  // Taken from Wikipedia at https://goo.gl/f4NJEq.
  let CHAR_FREQUENCIES = [
    ['A', 8.167],
    ['B', 1.492],
    ['C', 2.782],
    ['D', 4.253],
    ['E', 12.702],
    ['F', 2.228],
    ['G', 2.015],
    ['H', 6.094],
    ['I', 6.966],
    ['J', 0.153],
    ['K', 0.772],
    ['L', 4.025],
    ['M', 2.406],
    ['N', 6.749],
    ['O', 7.507],
    ['P', 1.929],
    ['Q', 0.095],
    ['R', 5.987],
    ['S', 6.327],
    ['T', 9.056],
    ['U', 2.758],
    ['V', 0.978],
    ['W', 2.36],
    ['X', 0.15],
    ['Y', 1.974],
    ['Z', 0.074]
  ];

  // TODO(wkorman): Share these with move picker somehow.
  let BOARD_HEIGHT = 7;
  let BOARD_WIDTH = 7;
  let TILE_COUNT = BOARD_WIDTH * BOARD_HEIGHT;

  return class extends DomParticle {
    get template() {
      return template;
    }
    _willReceiveProps(props, state) {
      if (!state.board) this._generateBoard();
    }
    _pickCharWithFrequencies() {
      let pick = Math.random() * 100;
      let accumulator = 0;
      for (let i = 0; i < CHAR_FREQUENCIES.length; i++) {
        accumulator += CHAR_FREQUENCIES[i][1];
        if (accumulator >= pick) return CHAR_FREQUENCIES[i][0];
      }
      return CHAR_FREQUENCIES[CHAR_FREQUENCIES.length - 1][0];
    }
    _generateBoard() {
      info('Generating board.');
      let boardChars = [];
      for (let i = 0; i < TILE_COUNT; i++)
        boardChars.push(this._pickCharWithFrequencies());
      const boardIn = this._views.get('board');
      let boardOut = new boardIn.entityClass({ letters: boardChars });
      boardIn.set(boardOut);
      this._setState({ board: boardOut });
    }
    _render(props, state) {
      return { complete: !!state.board };
    }
  };
});
