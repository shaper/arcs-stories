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

// A simple container for word text and its associated board tiles.
class WordEntry {
  constructor(text, tiles) {
    this.text = text;
    this.tiles = tiles;
  }
}

// Provides facilities for analyzing a board to obtain all known valid words.
class BoardSolver {
  constructor(dictionary, board) {
    this._dictionary = dictionary;
    this._board = board;
  }

  // Analyzes a board for words present that are considered valid by the given
  // dictionary. Returns an array of WordEntry instances describing the valid
  // words or an empty array if none are present.
  analyzeWords() {
    const validWords = [];
    for (let x = 0; x < TileBoard.BOARD_WIDTH; x++) {
      for (let y = 0; y < TileBoard.BOARD_HEIGHT; y++) {
        this._walkTileRecursive(x, y, new WordEntry('', []), validWords);
      }
    }
    return validWords;
  }

  _walkTileRecursive(x, y, word, validWords) {
    // Gracefully early-out if we've gone out of bounds.
    if (x < 0 || y < 0 || x > BOARD_WIDTH - 1 || y > BOARD_HEIGHT - 1) return;

    const currentTile = this._board.tileAt(x, y);
    const currentWord = word.text + currentTile.letter;

    if (!this._dictionary.contains(currentWord)) return;

    const newWord = new WordEntry(currentWord, word.tiles.slice());
    newWord.tiles.push(currentTile);

    // If the word is long enough, add it to the collection.
    if (Scoring.isMinimumWordLength(newWord.text)) validWords.push(newWord);

    // Recurse through all connected tiles looking for more valid words.

    // Above.
    this._walkTileRecursive(x, y - 1, newWord, validWords);
    // Below.
    this._walkTileRecursive(x, y + 1, newWord, validWords);
    // Left.
    this._walkTileRecursive(x - 1, y, newWord, validWords);
    // Left and offset below.
    if (currentTile.isShiftedDown)
      this._walkTileRecursive(x - 1, y - 1, newWord, validWords);
    // Left and offset above.
    if (!currentTile.isShiftedDown)
      this._walkTileRecursive(x - 1, y + 1, newWord, validWords);
    // Right.
    this._walkTileRecursive(x + 1, y, newWord, validWords);
    // Right and offset below.
    if (currentTile.isShiftedDown)
      this._walkTileRecursive(x + 1, y - 1, newWord, validWords);
    // Right and offset above.
    if (!currentTile.isShiftedDown)
      this._walkTileRecursive(x + 1, y + 1, newWord, validWords);
  }
}
