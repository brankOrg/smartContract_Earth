/* eslint-disable prefer-destructuring,class-methods-use-this */
const logger = require('../../lib/utils/Logger').getLogger('ChaincodeStub');

class ChaincodeStub {
  setCtx(ctx) {
    this.ctx = ctx;
  }

  createCompositeKey(objectType, attributes) {
    return this.ctx.createCompositeKey(objectType, attributes);
  }

  splitCompositeKey(compositeKey) {
    return this.ctx.splitCompositeKey(compositeKey);
  }

  async putState(key, value) {
    let v = value.toString('utf8');
    try {
      v = JSON.parse(v);
    } catch (e) {
      logger.error(e);
      throw e;
    }
    this.ctx.handlePutState(key, v);
  }

  async getState(key) {
    return this.ctx.handleGetState(key);
  }

  async getStateByPartialCompositeKey(key, attributes) {
    return this.ctx.handleGetStateByPartialCompositeKey(key, attributes);
  }

  async getQueryResult(query) {
    return this.ctx.handleGetQueryResult(query);
  }

  async deleteState(key) {
    return this.ctx.handleDeleteState(key);
  }

  getCreator() {
    const ADMIN_CERT = '-----BEGIN CERTIFICATE-----\n' +
      'MIIB/jCCAaWgAwIBAgIUJ0FIBtQPv8eS1d2BSuEZG+1b81EwCgYIKoZIzj0EAwIw\n' +
      'cDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\n' +
      'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xGTAXBgNVBAMT\n' +
      'EG9yZzEuZXhhbXBsZS5jb20wHhcNMTgwNjEyMDUyOTAwWhcNMTkwNjEyMDUzNDAw\n' +
      'WjAhMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBWFkbWluMFkwEwYHKoZIzj0C\n' +
      'AQYIKoZIzj0DAQcDQgAEG5B7R56co181Q2ZB/JrIzFOkMwBHt9AGP5vEjo0Ygyif\n' +
      'VLxtwfMF18hyhw9nwC4uhkRYyQ8zjylAAWVffCDm+aNsMGowDgYDVR0PAQH/BAQD\n' +
      'AgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFOA4uxRPp4eWgl87E/ASeTLSGSBB\n' +
      'MCsGA1UdIwQkMCKAIKItrzVrKqtXkupT419m/M7x1/GqKzorktv7+WpEjqJqMAoG\n' +
      'CCqGSM49BAMCA0cAMEQCIBbYdKWW/vSsJAmxyGleTQQvcczl7tP48hRsGlzNErUT\n' +
      'AiB2sMOGoAV52IY1oZXdwLG+HzVXk0G4oUYgq2/DRZi66g==\n' +
      '-----END CERTIFICATE-----\n';
    let user = ADMIN_CERT;
    if (this.user) {
      user = this.user;
    }

    function getIdBytes() {
      return Buffer.from(user);
    }

    return { getIdBytes };
  }

  getTxTimestamp() {
    return {
      seconds: {
        low: Date.now() / 1000,
        toInt: () => Date.now() / 1000,
      },
      nanos: Date.now() - (Date.now() / 1000),
    };
  }

  getTxID() {
    return Math.random().toFixed(15).toString();
  }

  setUserCtx(cert) {
    this.user = cert;
  }

  cleanUserCtx() {
    this.user = null;
  }
}

module.exports = ChaincodeStub;
