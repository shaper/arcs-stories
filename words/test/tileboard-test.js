// Copyright (c) 2017 Google Inc. All rights reserved.
// This code may only be used under the BSD style license found at
// http://polymer.github.io/LICENSE.txt
// Code distributed by Google as part of this project is also
// subject to an additional IP rights grant found at
// http://polymer.github.io/PATENTS.txt

var assert = chai.assert;

describe('TileBoard', function() {
  const savePickCharWithFrequencies = TileBoard.pickCharWithFrequencies;
  describe('#applyMove()', function() {
    before(function() {
      TileBoard.pickCharWithFrequencies = () => {
        return '=';
      };
    });

    after(function() {
      TileBoard.pickCharWithFrequencies = savePickCharWithFrequencies;
    });

    function createDefaultBoard() {
      return new TileBoard({
        letters:
          'ABCDEFG' +
          'HIJKLMN' +
          'OPQRSTU' +
          'VWXYZAB' +
          'CDEFGHI' +
          'JKLMNOP' +
          'QRSTUVW'
      });
    }

    it('should destroy tiles at top left corner of board correctly', function() {
      const board = createDefaultBoard();
      const tiles = [new Tile(0, 'A'), new Tile(1, 'B'), new Tile(2, 'C')];
      board.applyMove(tiles);
      const expectedBoard =
        '===DEFG' +
        'HIJKLMN' +
        'OPQRSTU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy all tiles at top of board correctly', function() {
      const board = createDefaultBoard();
      const tiles = [
        new Tile(0, 'A'),
        new Tile(1, 'B'),
        new Tile(2, 'C'),
        new Tile(3, 'D'),
        new Tile(4, 'E'),
        new Tile(5, 'F'),
        new Tile(6, 'G')
      ];
      board.applyMove(tiles);
      const expectedBoard =
        '=======' +
        'HIJKLMN' +
        'OPQRSTU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy tiles mid-board correctly', function() {
      const board = createDefaultBoard();
      const tiles = [new Tile(16, 'Q'), new Tile(17, 'R'), new Tile(18, 'S')];
      board.applyMove(tiles);
      const expectedBoard =
        'AB===FG' +
        'HICDEMN' +
        'OPJKLTU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy tiles mid-board multi-row correctly', function() {
      const board = createDefaultBoard();
      const tiles = [
        new Tile(16, 'Q'),
        new Tile(17, 'R'),
        new Tile(18, 'S'),
        new Tile(11, 'L')
      ];
      board.applyMove(tiles);
      const expectedBoard =
        'AB===FG' +
        'HICD=MN' +
        'OPJKETU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy tiles mid-board multi-row and looping back correctly', function() {
      const board = createDefaultBoard();
      const tiles = [
        new Tile(16, 'Q'),
        new Tile(17, 'R'),
        new Tile(18, 'S'),
        new Tile(11, 'L'),
        new Tile(10, 'K'),
        new Tile(9, 'J')
      ];
      board.applyMove(tiles);
      const expectedBoard =
        'AB===FG' +
        'HI===MN' +
        'OPCDETU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy tiles mid-board multi-row-interspersed and looping back correctly', function() {
      const board = createDefaultBoard();
      const tiles = [
        new Tile(16, 'Q'),
        new Tile(17, 'R'),
        new Tile(18, 'S'),
        new Tile(11, 'L'),
        new Tile(4, 'E'),
        new Tile(3, 'D'),
        new Tile(2, 'C')
      ];
      board.applyMove(tiles);
      const expectedBoard =
        'AB===FG' +
        'HI===MN' +
        'OPJK=TU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP' +
        'QRSTUVW';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy tiles at bottom right corner of board correctly', function() {
      const board = createDefaultBoard();
      const tiles = [new Tile(46, 'U'), new Tile(47, 'V'), new Tile(48, 'W')];
      board.applyMove(tiles);
      const expectedBoard =
        'ABCD===' +
        'HIJKEFG' +
        'OPQRLMN' +
        'VWXYSTU' +
        'CDEFZAB' +
        'JKLMGHI' +
        'QRSTNOP';
      assert.equal(board.toString, expectedBoard);
    });

    it('should destroy all tiles at bottom of board correctly', function() {
      const board = createDefaultBoard();
      const tiles = [
        new Tile(42, 'Q'),
        new Tile(43, 'R'),
        new Tile(44, 'S'),
        new Tile(45, 'T'),
        new Tile(46, 'U'),
        new Tile(47, 'V'),
        new Tile(48, 'W')
      ];
      board.applyMove(tiles);
      const expectedBoard =
        '=======' +
        'ABCDEFG' +
        'HIJKLMN' +
        'OPQRSTU' +
        'VWXYZAB' +
        'CDEFGHI' +
        'JKLMNOP';
      assert.equal(board.toString, expectedBoard);
    });
  });

  describe('#pickCharWithFrequencies()', function() {
    it('should return a single caps alpha character', function() {
      let result = TileBoard.pickCharWithFrequencies();
      assert.equal(result.length, 1);
      assert.isTrue(/[A-Z]/.test(result));
    });
  });

  describe('#toString', function() {
    it('should concatenate all tiles into a single string', function() {
      const board = new TileBoard({
        letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW'
      });
      assert.equal(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW',
        board.toString
      );
    });
  });
});
