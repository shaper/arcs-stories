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

var TileBoard = class {
  constructor(board) {
    this._rows = [];
    let colCount = 0;
    let rowCount = 0;
    for (let i = 0; i < board.letters.length; i++) {
      if (colCount == 0) this._rows.push([]);
      this._rows[rowCount][colCount] = new Tile(i, board.letters[i]);
      if (colCount == BOARD_WIDTH - 1) {
        colCount = 0;
        rowCount++;
      } else {
        colCount++;
      }
    }
  }
  applyMove(tiles) {
    // Destroy tiles in the move.
    for (let t = 0; t < tiles.length; t++) {
      const currentTile = tiles[t];
      // TileBoard.info(`Destroying tile [tile=${currentTile.toString}].`);
      this._rows[currentTile.y][currentTile.x] = null;
    }

    // Shift down all tiles above the moved tiles.
    for (let t = 0; t < tiles.length; t++) {
      // Keep track of the next spot to fill so that we can correctly
      // collapse potentially multiple empty spaces above the destroyed tile.
      const currentTile = tiles[t];
      let nextPlaceY = currentTile.y;
      let y = currentTile.y - 1;
      while (y >= 0) {
        if (this._rows[y][currentTile.x]) {
          // Move this tile above the destroyed tile down to the next spot.
          // info(
          //   `Moving tile down to fill hole [srcX=${
          //     currentTile.x
          //   }, srcY=${y}, destY=${nextPlaceY}].`
          // );
          this._rows[nextPlaceY][currentTile.x] = this._rows[y][currentTile.x];
          this._rows[y][currentTile.x] = null;
          nextPlaceY--;
        }
        y--;
      }
    }

    // Generate new tiles for the empty spaces that remain.
    // TODO(wkorman): Reuse logic in BoardGenerator somehow.
    for (let t = 0; t < tiles.length; t++) {
      const currentTile = tiles[t];
      for (let y = currentTile.y; y >= 0; y--) {
        if (!this._rows[y][currentTile.x]) {
          this._rows[y][currentTile.x] = new Tile(
            y * BOARD_WIDTH + currentTile.x,
            LetterBoard.pickCharWithFrequencies()
          );
        }
      }
    }
  }
  get toString() {
    return this._rows.map(r => r.map(c => c.letter).join('')).join('');
  }
};

TileBoard.info = console.log.bind(
  console.log,
  '%cTileBoard',
  `background: #3de8ea; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
);
