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

// Taken from Wikipedia at https://goo.gl/f4NJEq.
var CHAR_FREQUENCIES = [
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

var BOARD_HEIGHT = 7;
var BOARD_WIDTH = 7;
var TILE_COUNT = BOARD_WIDTH * BOARD_HEIGHT;

var TileBoard = class {
  constructor(board) {
    this._shuffleAvailableCount = board.shuffleAvailableCount;
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
  get shuffleAvailableCount() {
    return this._shuffleAvailableCount;
  }
  get size() {
    return TILE_COUNT;
  }
  tileAt(x, y) {
    return this._rows[y][x];
  }
  tileAtIndex(index) {
    return this._rows[Math.floor(index / BOARD_WIDTH)][index % BOARD_WIDTH];
  }
  _tileArrayContainsTile(tileArray, tile) {
    return tileArray.find(t => t.x == tile.x && t.y == tile.y);
  }
  isMoveValid(selectedTiles, tile) {
    // Initial moves are considered valid.
    if (selectedTiles.length == 0) return true;
    // Selecting the last selected tile is permitted so as to de-select.
    let lastSelectedTile = selectedTiles[selectedTiles.length - 1];
    if (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y)
      return true;
    // Else the new selection must touch the last selection and can't
    // already be selected.
    let touchesLastSelectedTile =
      // Above.
      (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y - 1) ||
      // Below.
      (lastSelectedTile.x == tile.x && lastSelectedTile.y == tile.y + 1) ||
      // Right.
      (lastSelectedTile.x == tile.x - 1 && lastSelectedTile.y == tile.y) ||
      // Right and offset below.
      (lastSelectedTile.x == tile.x - 1 &&
        lastSelectedTile.isShiftedDown &&
        lastSelectedTile.y == tile.y - 1) ||
      // Right and offset above.
      (lastSelectedTile.x == tile.x - 1 &&
        !lastSelectedTile.isShiftedDown &&
        lastSelectedTile.y == tile.y + 1) ||
      // Left.
      (lastSelectedTile.x == tile.x + 1 && lastSelectedTile.y == tile.y) ||
      // Left and offset below.
      (lastSelectedTile.x == tile.x + 1 &&
        lastSelectedTile.isShiftedDown &&
        lastSelectedTile.y == tile.y - 1) ||
      // Left and offset above.
      (lastSelectedTile.x == tile.x + 1 &&
        !lastSelectedTile.isShiftedDown &&
        lastSelectedTile.y == tile.y + 1);
    return (
      touchesLastSelectedTile &&
      !this._tileArrayContainsTile(selectedTiles, tile)
    );
  }
  applyMove(tiles) {
    // Destroy tiles in the move.
    for (let t = 0; t < tiles.length; t++) {
      const currentTile = tiles[t];
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
          this._rows[nextPlaceY][currentTile.x] = this._rows[y][currentTile.x];
          this._rows[y][currentTile.x] = null;
          nextPlaceY--;
        }
        y--;
      }
    }

    // Generate new tiles for the empty spaces that remain.
    for (let t = 0; t < tiles.length; t++) {
      const currentTile = tiles[t];
      for (let y = currentTile.y; y >= 0; y--) {
        if (!this._rows[y][currentTile.x]) {
          this._rows[y][currentTile.x] = new Tile(
            y * BOARD_WIDTH + currentTile.x,
            TileBoard.pickCharWithFrequencies()
          );
        }
      }
    }
  }
  shuffle() {
    if (this._shuffleAvailableCount <= 0) return false;
    // Fisher-Yates shuffle per https://bost.ocks.org/mike/shuffle/
    let m = TILE_COUNT;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      const tx = TileBoard.indexToX(i);
      const ty = TileBoard.indexToY(i);
      const mx = TileBoard.indexToX(m);
      const my = TileBoard.indexToY(m);
      const t = this._rows[my][mx];
      this._rows[my][mx] = this._rows[ty][tx];
      this._rows[ty][tx] = t;
    }
    this._shuffleAvailableCount--;
    return true;
  }
  get toString() {
    return this._rows.map(r => r.map(c => c.letter).join('')).join('');
  }
  static pickCharWithFrequencies() {
    let pick = Math.random() * 100;
    let accumulator = 0;
    for (let i = 0; i < CHAR_FREQUENCIES.length; i++) {
      accumulator += CHAR_FREQUENCIES[i][1];
      if (accumulator >= pick) return CHAR_FREQUENCIES[i][0];
    }
    return CHAR_FREQUENCIES[CHAR_FREQUENCIES.length - 1][0];
  }
  static indexToX(index) {
    return index % BOARD_WIDTH;
  }
  static indexToY(index) {
    return Math.floor(index / BOARD_HEIGHT);
  }
};

TileBoard.info = console.log.bind(
  console.log,
  '%cTileBoard',
  `background: #3de8ea; color: white; padding: 1px 6px 2px 7px; border-radius: 6px;`
);
