// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

var assert = chai.assert;

describe('Scoring', function() {
  describe('#isMinimumWordLength()', function() {
    it('should report word length requirements correctly', function() {
      assert.isFalse(Scoring.isMinimumWordLength(0));
      assert.isTrue(Scoring.isMinimumWordLength(3));
      assert.isTrue(Scoring.isMinimumWordLength(30));
    });
  });

  describe('#pointsForLetter()', function() {
    it('should report letter points correctly', function() {
      assert.equal(Scoring.pointsForLetter('A'), 1);
      assert.equal(Scoring.pointsForLetter('O'), 1);
      assert.equal(Scoring.pointsForLetter('Z'), 3);
    });
  });

  describe('#wordScore()', function() {
    function tilesForWord(word) {
      let tiles = [];
      for (let i = 0; i < word.length; i++) {
        tiles.push(new Tile(i, word.charAt(i)));
      }
      return tiles;
    }
    it('should score a basic word correctly', function() {
      assert.equal(Scoring.wordScore(tilesForWord('ABC')), 7);
      assert.equal(Scoring.wordScore(tilesForWord('ABCD')), 18);
    });
    it('should score a word with a multiplier correctly', function() {
      assert.equal(Scoring.wordScore(tilesForWord('ABCD')), 18);
    });
    it('should score a word with exactly the maximum multiplier correctly', function() {
      assert.equal(Scoring.wordScore(tilesForWord('ABCDABCDABCD')), 135);
    });
    it('should score a word with more chars than specified by the maximum multiplier correctly', function() {
      assert.equal(Scoring.wordScore(tilesForWord('ABCDABCDABCDABCD')), 180);
    });
  });
});
