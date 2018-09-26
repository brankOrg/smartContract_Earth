/* eslint-disable no-new */
const BaseModel = require('../../lib/model/BaseModel');
const chai = require('chai');
const chaiPromised = require('chai-as-promised');
const MockStub = require('../mock-stub');
const sinon = require('sinon');

chai.use(chaiPromised);
const should = chai.should();

describe('Unit Test For BaseModel', () => {
  const stub = sinon.stub();

  describe('Test constructor', () => {
    it('construct without stub should throw error', () => {
      should.throw(() => {
        new BaseModel();
      }, /Missing Required Argument stub/);
    });

    it('construct with stub should success', () => {
      should.not.throw(() => {
        new BaseModel(stub);
      });
    });
  });

  describe('Test toJSON()', () => {
    it('Call toJSON() should throw error', () => {
      const base = new BaseModel(stub);
      should.throw(() => {
        base.toJSON();
      }, /Abstract method called/);
    });
  });

  describe('Test toString()', () => {
    it('Call toString() should return the serialized model', () => {
      stub.reset();
      const base = new BaseModel(stub);
      const toJSONStub = sinon.stub();
      const obj = {
        foo: 'bar',
        hello: 'world',
      };
      base.toJSON = toJSONStub.returns(obj);
      const res = base.toString();
      res.should.eq(JSON.stringify(obj));
    });
  });

  describe('Test toBuffer()', () => {
    it('Call toBuffer() should success for a valid model', () => {
      stub.reset();
      const base = new BaseModel(stub);
      const toJSONStub = sinon.stub();
      const obj = {
        foo: 'bar',
        hello: 'world',
      };
      base.toJSON = toJSONStub.returns(obj);
      return base.toBuffer();
    });
  });
});
