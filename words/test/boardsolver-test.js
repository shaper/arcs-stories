// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

var assert = chai.assert;

describe('BoardSolver', function() {
  describe('#getValidWords()', function() {
    it('should return empty list with no valid words', function() {
      const dictionary = new Dictionary('cat');
      const board = new TileBoard();
      const solver = new BoardSolver(dictionary, board);
      assert.equal(solver.getValidWords().length, 0);
    });

    it('should return single word', function() {
      const dictionary = new Dictionary('cat');
      const board = new TileBoard({
        letters:
          'ZZZZZZZ' +
          'ZZZZZZZ' +
          'ZZZCZZZ' +
          'ZZZAZZZ' +
          'ZZZTZZZ' +
          'ZZZZZZZ' +
          'ZZZZZZZ',
        shuffleAvailableCount: 0
      });
      const solver = new BoardSolver(dictionary, board);
      const validWords = solver.getValidWords();
      assert.equal(validWords.length, 1);
      assert.equal(validWords[0].text, 'CAT');
    });
  });
});
