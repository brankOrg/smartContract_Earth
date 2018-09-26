const assert = require('assert');

const TypeChecker = require('../../lib/utils/TypeChecker');

describe('Test utils/typechecker', () => {
  it('checkInteger()', () => {
    let res = TypeChecker.checkInteger(123);
    assert.equal(res, true);
    res = TypeChecker.checkInteger('false');
    assert.equal(res, false);
    res = TypeChecker.checkInteger('123');
    assert.equal(res, false);
    res = TypeChecker.checkInteger(false);
    assert.equal(res, false);
    res = TypeChecker.checkInteger(true);
    assert.equal(res, false);
    // 2^53 - 1 is a valid Integer
    res = TypeChecker.checkInteger(9007199254740991);
    assert.equal(res, true);
    // 2^53 is not a valid Integer
    res = TypeChecker.checkInteger(9007199254740992);
    assert.equal(res, false);
  });

  it('checkUint4()', async () => {
    let res = TypeChecker.checkUint4(12);
    assert.equal(res, true);
    res = TypeChecker.checkUint4(16);
    assert.equal(res, false);
    res = TypeChecker.checkUint4(-1);
    assert.equal(res, false);
    res = TypeChecker.checkUint4(0);
    assert.equal(res, true);
    res = TypeChecker.checkUint4('11');
    assert.equal(res, false);
  });

  it('checkString()', async () => {
    let res = TypeChecker.checkString('123');
    assert.equal(res, true);
    res = TypeChecker.checkString(123);
    assert.equal(res, false);
    res = TypeChecker.checkString(false);
    assert.equal(res, false);
    res = TypeChecker.checkString([]);
    assert.equal(res, false);
    res = TypeChecker.checkString({});
    assert.equal(res, false);
  });

  it('checkBoolean()', async () => {
    let res = TypeChecker.checkBoolean(true);
    assert.equal(res, true);
    res = TypeChecker.checkBoolean(true);
    assert.equal(res, true);
    res = TypeChecker.checkBoolean(123);
    assert.equal(res, false);
    res = TypeChecker.checkBoolean('123');
    assert.equal(res, false);
    res = TypeChecker.checkBoolean([]);
    assert.equal(res, false);
  });
});
