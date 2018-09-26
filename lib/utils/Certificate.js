const { KEYUTIL, KJUR, X509 } = require('jsrsasign');


/**
 * A class representing a digital certificate, the public part of an identity.
 */
class Certificate {
  /**
   * Constructor.
   * @param {string} pem The PEM encoded certificate.
   */
  constructor(pem) {
    this.pem = pem;
    this.certificate = new X509();
    this.certificate.readCertPEM(pem);
    this.publicKey = KEYUTIL.getPEM(this.certificate.getPublicKey());
    this.identifier = KJUR.crypto.Util.hashHex(this.certificate.getPublicKey().pubKeyHex, 'sha256');
    this.issuer = KJUR.crypto.Util.hashHex(this.certificate.getIssuerString(), 'sha256');
    // eslint-disable-next-line prefer-destructuring
    this.name = /(\/CN=)(.*?)(\/|,|$)/.exec(this.certificate.getSubjectString())[2];
  }

  /**
   * Get the PEM encoded certificate.
   * @return {string} The PEM encoded certificate.
   */
  getCertificate() {
    return this.pem;
  }

  /**
   * Get the PEM encoded public key.
   * @return {string} The PEM encoded public key.
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Get the unique identifier.
   * @return {string} The unique identifier.
   */
  getIdentifier() {
    return this.identifier;
  }

  /**
   * Get the issuer.
   * @return {string} The issuer.
   */
  getIssuer() {
    return this.issuer;
  }

  /**
   * Get the name.
   * @return {string} The name.
   */
  getName() {
    return this.name;
  }
}

module.exports = Certificate;
