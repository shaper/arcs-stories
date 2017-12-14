// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

var assert = chai.assert;

describe('LetterBoard', function() {
  describe('#pickCharWithFrequencies()', function() {
    it('should return a single character', function() {
      let result = LetterBoard.pickCharWithFrequencies();
      assert.equal(result.length, 1);
      assert.isTrue(/[A-Z]/.test(result));
    });
  });
});
