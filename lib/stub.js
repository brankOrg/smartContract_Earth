const getAllResults = require('./utils/IterParser');

class Stub {
  constructor(stub) {
    this.stub = stub;
  }

  getArgs() {
    return this.stub.getArgs();
  }

  getStringArgs() {
    return this.stub.getStringArgs();
  }

  getFunctionAndParameters() {
    return this.stub.getFunctionAndParameters();
  }

  getTxID() {
    return this.stub.getTxID();
  }

  getChannelID() {
    return this.stub.get;
  }

  getCreator() {
    return this.stub.getCreator();
  }

  getSignedProposal() {
    return this.stub.getSignedProposal();
  }

  getTxTimestamp() {
    return this.stub.getTxTimestamp();
  }

  getState(key) {
    return this.stub.getState(key);
  }

  putState(key, val) {
    return this.stub.putState(key, val);
  }

  deleteState(key) {
    return this.stub.deleteState(key);
  }

  async getQueryResult(query) {
    const iter = await this.stub.getQueryResult(query);
    return getAllResults(iter);
  }

  createCompositeKey(objectType, attributes) {
    return this.stub.createCompositeKey(objectType, attributes);
  }

  async getStateByPartialCompositeKey(objectType, attributes) {
    const iter = await this.stub.getStateByPartialCompositeKey(objectType, attributes);
    return getAllResults(iter);
  }
}

module.exports = Stub;
