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
  importScripts(resolver('BoardGenerator/LetterBoard.js'));

  const host = `board-generator`;

  const template = `
  <div ${host}>
    <div hidden="{{complete}}" style="padding: 10px 6px">Generating board...</div>
    <div slotid="pickmove"></div>
  </div>
    `.trim();

  const info = console.log.bind(
    console.log,
    '%cBoardGenerator',
    `background: #ee82ee; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
  );

  return class extends DomParticle {
    get template() {
      return template;
    }
    _willReceiveProps(props, state) {
      if (!state.board) this._generateBoard();
    }
    _generateBoard() {
      info('Generating board.');
      let boardChars = [];
      for (let i = 0; i < TILE_COUNT; i++)
        boardChars.push(LetterBoard.pickCharWithFrequencies());
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
