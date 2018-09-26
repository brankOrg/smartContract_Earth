/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const Certificate = require('../../lib/utils/Certificate');

describe('Test utils/Certificate', () => {
  const ADMIN_CERT = '-----BEGIN CERTIFICATE-----\n' +
    'MIICAjCCAaigAwIBAgIUQt5hB9GGf9ZV0TxB9CEunOH4nPAwCgYIKoZIzj0EAwIw\n' +
    'czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\n' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\n' +
    'E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgwNjE1MDUzOTAwWhcNMTkwNjE1MDU0\n' +
    'NDAwWjAhMQ8wDQYDVQQLEwZjbGllbnQxDjAMBgNVBAMTBWFkbWluMFkwEwYHKoZI\n' +
    'zj0CAQYIKoZIzj0DAQcDQgAEyqY5Nznpicbr+6m+6rzuaaLd8MMgzJ5XvxeVyFvo\n' +
    'OCYs1g9PuJOO0d/6Pkv3yKWyZWAafTYA5aU8yE6GvjyQiqNsMGowDgYDVR0PAQH/\n' +
    'BAQDAgeAMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFPd8aFyXmRrrVjThKvhZSkqE\n' +
    'j64bMCsGA1UdIwQkMCKAIJZUB3yZtmKK6RU31ouClmtA9jIDecvBTx/YgqTavJWU\n' +
    'MAoGCCqGSM49BAMCA0gAMEUCIQDuQXY9xUW2LfVuyKvVdM4M1cGCPBQND+xtJK8F\n' +
    '7gDcnAIgLqWDBBb7irZ7JLqxBjHqzTvm34ym1ISQj2J03fzzwJY=\n' +
    '-----END CERTIFICATE-----\n';

  it('Certificate Test', () => {
    const certificate = new Certificate(ADMIN_CERT);
    expect(certificate).exist;
    expect(certificate.name).exist;
    expect(certificate.name).to.equal('admin');
    const name = certificate.getName();
    expect(name).to.equal('admin');
    const pem = certificate.getCertificate();
    expect(pem).to.equal(ADMIN_CERT);
    const publicKey = certificate.getPublicKey();
    expect(publicKey).exist;
    const issuer = certificate.getIssuer();
    expect(issuer).exist;
    const identifier = certificate.getIdentifier();
    expect(identifier).exist;
  });
});
