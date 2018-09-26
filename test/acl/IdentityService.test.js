/* eslint-disable no-unused-expressions */
const MockStub = require('../mock-stub.js');
const IdentityService = require('../../lib/acl/IdentityService');
const { expect } = require('chai');

const stub = new MockStub();

describe('Test IdentityService', () => {
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

  it('IdentityService should provide certificate info', async () => {
    const s = new IdentityService(stub);
    s.loadCertificate();
    const name = s.getName();
    expect(name).to.equal('admin');
    const certificate = s.getCertificate();
    expect(certificate).to.equal(ADMIN_CERT);
    const issuer = s.getIssuer();
    expect(issuer).exist;
    const identifier = s.getIdentifier();
    expect(identifier).exist;
  });

  it('IdentityService should lazy load certificate info', () => {
    let s = new IdentityService(stub);
    const name = s.getName();
    expect(name).to.equal('admin');

    s = new IdentityService(stub);
    const certificate = s.getCertificate();
    expect(certificate).to.equal(ADMIN_CERT);

    s = new IdentityService(stub);
    const issuer = s.getIssuer();
    expect(issuer).to.exist;

    s = new IdentityService(stub);
    const identifier = s.getIdentifier();
    expect(identifier).to.exist;
  });
});
