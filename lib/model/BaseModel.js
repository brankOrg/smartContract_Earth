/* eslint-disable no-unused-vars */
const logger = require('../utils/Logger').getLogger('BaseModel');
const IdentityService = require('../acl/IdentityService');

class BaseModel {
  constructor(stub) {
    const method = 'constructor';
    logger.enter(method);
    if (!stub) {
      logger.error('%s - Missing Required Argument stub', method);
      throw new Error('Missing Required Argument stub');
    }
    this.stub = stub;
    logger.exit(method);
  }

  fromJSON(obj) {
    Object.assign(this, obj);
    return this;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  toBuffer() {
    return Buffer.from(this.toString());
  }

  async save() {
    if (!this.key) {
      throw new Error('Missing Required Model key at save()');
    }

    await this.stub.putState(this.key, this.toBuffer());
  }

  async getByPartialCompositeKey(...args) {
    return this.stub.getStateByPartialCompositeKey(this.prefix, args);
  }

  async validationAndAcl(method, options) {
    await this.validateOptions(method, options);
    logger.debug('%s - Pass Validation check', method);
    await this.checkPermission(method, options);
    logger.debug('%s - Pass permission check', method);
  }

  /**
   * getOne return the obj with this.key
   * return null if this.key not found
   * else set the properties to this, and return this
   * @returns {Promise<*>}
   */
  async getOne() {
    const method = 'getOne';
    logger.enter(method);
    if (!this.stub) {
      throw new Error('Missing Required Argument "stub" in getOne()');
    }
    if (!this.key) {
      throw new Error('Missing Required Argument "key" in getOne()');
    }

    await this.validationAndAcl(method, null);

    let model = (await this.stub.getState(this.key)).toString('utf8');
    if (!model) {
      logger.info('%s - Can not find Model %s', method, this.key);
      return null;
    }
    model = JSON.parse(model);
    logger.debug('%s - Successfully get Model from bc. %j', method, model);
    logger.exit(method);
    return this.fromJSON(model);
  }

  /**
   * The init transaction
   * @param options
   * @returns {Promise<void>}
   */
  async init(options) {
    const method = 'init';
    logger.enter(method);

    await this.validationAndAcl(method, options);
    await this.doInit(options);

    await this.save();
    logger.exit(method);
  }

  /**
   * Create a new Model
   *
   * @param {Object} options
   * @returns {Promise<void>}
   */
  async create(options) {
    const method = 'create';
    logger.enter(method);

    await this.validationAndAcl(method, options);

    // at doCreate we set this.key
    await this.doCreate(options);

    await this.save();
    logger.exit(method);
  }

  /**
   * Return the common name of current identity
   * @returns {string}
   */
  getCN() {
    const identityService = new IdentityService(this.stub);
    return identityService.getName();
  }

  /**
   * Build key
   * @param {string[]} args
   * @returns {string|*}
   */
  buildKey(...args) {
    if (!this.stub) {
      throw new Error('Missing required argument "this.stub" at buildKey');
    }
    if (!this.prefix) {
      throw new Error('Missing required argument "this.prefix" at buildKey');
    }
    this.key = this.stub.createCompositeKey(this.prefix, args);
    return this.key;
  }

  /**
   * The Following Abstract method need to be implemented by any Model inherits the BaseModel
   */

  /**
   * Update an model
   * @param {any} options
   */
  async update(options) {
    const method = 'update';
    logger.enter(method);

    await this.validationAndAcl(method, options);
    await this.doUpdate(options);
    await this.save();
    logger.exit(method);
  }

  async doCreate() {
    throw new Error('Abstract method called, doCreate() is not implemented');
  }

  async doUpdate() {
    throw new Error('Abstract method called, doUpdate() is not implemented');
  }

  async doInit() {
    throw new Error('Abstract method called, doInit() is not implemented');
  }

  /**
   * Called during a tx
   * @param fcn
   * @param options
   */
  validateOptions(fcn, options) {
    throw new Error('Abstract method called, validateOptions() is not implemented');
  }

  /**
   * Called After validateOptions()
   * @param fcn
   * @param options
   */
  checkPermission(fcn, options) {
    throw new Error('Abstract method called, checkPermission() is not implemented');
  }

  toJSON() {
    throw new Error('Abstract method called, toJSON() is not implemented');
  }
}

module.exports = BaseModel;
