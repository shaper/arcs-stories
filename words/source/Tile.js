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

// A specific tile on the board with an index, position and character.
class Tile {
  constructor(charIndex, letter) {
    this._charIndex = charIndex;
    this._letter = letter;
    this._x = TileBoard.indexToX(charIndex);
    this._y = TileBoard.indexToY(charIndex);
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
  get isShiftedDown() {
    return this._x % 2 == 0;
  }
  get toString() {
    return `[charIndex=${this.charIndex}, letter=${this.letter}, x=${
      this.x
    }, y=${this.y}]`;
  }
};
