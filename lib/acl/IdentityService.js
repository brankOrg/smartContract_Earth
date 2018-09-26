const Certificate = require('../utils/Certificate');

class IdentityService {
  /**
   * Constructor.
   */
  constructor(stub) {
    this.stub = stub;
  }

  // Load and process a certificate.
  loadCertificate() {
    const creator = this.stub.getCreator();
    this.pem = creator.getIdBytes().toString('utf8');
    if (this.pem && this.pem.startsWith('-----BEGIN CERTIFICATE-----')) {
      this.certificate = new Certificate(this.pem);
      this.identifier = this.certificate.getIdentifier();
      this.issuer = this.certificate.getIssuer();
      this.name = this.certificate.getName();
    } else {
      throw new Error('No creator certificate provided or not a valid x509 certificate');
    }
  }

  /**
   * Get a unique identifier for the identity used to submit the transaction.
   * @return {string} A unique identifier for the identity used to submit the transaction.
   */
  getIdentifier() {
    if (!this.identifier) {
      this.loadCertificate();
    }
    return this.identifier; // this.Certificate.raw, hashed using sha256 and sum result
  }

  /**
   * Get the name of the identity used to submit the transaction.
   * @return {string} The name of the identity used to submit the transaction.
   */
  getName() {
    if (!this.name) {
      this.loadCertificate();
    }
    return this.name;
  }

  /**
   * Get the issuer of the identity used to submit the transaction.
   * @return {string} The issuer of the identity used to submit the transaction.
   */
  getIssuer() {
    if (!this.issuer) {
      this.loadCertificate();
    }
    return this.issuer; // this.Certificate.Issuer.raw, hashed using sha256 and sum result
  }

  /**
   * Get the certificate for the identity used to submit the transaction.
   * @return {string} The certificate for the identity used to submit the transaction.
   */
  getCertificate() {
    if (!this.pem) {
      this.loadCertificate();
    }
    return this.pem;
  }
}

module.exports = IdentityService;
