/* eslint-disable class-methods-use-this,no-restricted-syntax */
const BaseModel = require('./BaseModel');
const util = require('util');
const {
  ACCOUNT_PREFIX,
  EARTH_MODEL_ACCOUNT,
  EARTH_MODEL_TX,
  EARTH_MODEL_WALLET,
  EARTH_ACCOUNT_TYPE_ADMIN,
  EARTH_ACCOUNT_TYPE_USER,
} = require('../utils/Constants');
const SchemaCheker = require('../utils/SchemaChecker');
const logger = require('../utils/Logger').getLogger('Account');

class Account extends BaseModel {
  constructor(stub) {
    super(stub);
    this.prefix = ACCOUNT_PREFIX;
    this.model = EARTH_MODEL_ACCOUNT;
    this.buildKey(this.getCN());
  }

  async doCreate(options) {
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.buildKey(this.id);
  }

  async doInit(options) {
    return this.doCreate(options);
  }

  /**
   * Update an model
   * @param {any} options
   */
  async update(options) {
    const method = 'update';
    logger.enter(method);

    await this.validationAndAcl(method, options);
    await this.doUpdate(options);
    logger.exit(method);
  }

  /**
   * id can not be updated
   * @param options
   * @returns {Promise<void>}
   */
  async doUpdate(options) {
    const method = 'doUpdate';
    logger.enter(method);
    logger.debug('update account by options:%j', options);
    this.buildKey(options.id);
    let target = (await this.stub.getState(this.key)).toString('utf8');
    target = JSON.parse(target);
    target.role = 'admin';
    logger.debug('%s - update account %s to admin account', method, options.id);
    await this.stub.putState(this.key, Buffer.from(JSON.stringify(target)));
    logger.exit(method);
  }

  async exists(id) {
    const method = 'exists';
    logger.enter(method);
    if (!this.stub) {
      throw new Error('Missing Required Argument "stub" in get()');
    }

    const key = this.buildKey(id);
    const res = !!(await this.stub.getState(key)).toString('utf8');
    logger.debug('%s - account with id:%s exists:%s', method, id, res);
    logger.exit(method);
    return res;
  }

  validateOptions(fcn, options) {
    switch (fcn) {
      case 'create':
        this.checkCreateOptions(options);
        break;
      case 'update':
        this.checkUpdateOptions(options);
        break;
      default:
        logger.warn('no \'validateOptions\' implementation found for function %s', fcn);
        // eslint-disable-next-line no-useless-return,consistent-return
        return;
    }
  }

  async checkPermission(fcn, options) {
    switch (fcn) {
      case 'create':
        await this.checkCreatePermission(options);
        break;
      case 'update':
        await this.checkUpdatePermission(options);
        break;
      default:
        logger.warn('no \'checkPermission\' implementation found for function %s', fcn);
        // eslint-disable-next-line no-useless-return,consistent-return
        return;
    }
  }

  async checkCreatePermission(options) {
    if (options.role === EARTH_ACCOUNT_TYPE_USER) {
      const id = this.getCN();
      if (id !== options.id) {
        throw new Error(util.format('Identity %s do not have permission to create new User %s', id, options.id));
      }
    }

    if (options.role === EARTH_ACCOUNT_TYPE_ADMIN) {
      throw new Error(util.format('Can not create Admin account'));
    }

    const exists = await this.exists(options.id);
    if (exists) {
      throw new Error(util.format('Account with id %s already exists', options.id));
    }
  }

  async checkUpdatePermission(options) {
    await this.getOne();
    if (this.role !== EARTH_ACCOUNT_TYPE_ADMIN) {
      throw new Error('Current identity do not have permission to update account, need admin');
    }
    const exists = await this.exists(options.id);
    if (!exists) {
      throw new Error(util.format('Account with id %s does not exist', options.id));
    }
  }

  checkCreateOptions(options) {
    const fields = [
      { name: 'id', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'role', type: 'string', required: true },
    ];
    SchemaCheker.check(fields, options);
  }

  checkUpdateOptions(options) {
    const fields = [
      { name: 'id', type: 'string', required: true },
    ];
    SchemaCheker.check(fields, options);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      model: this.model,
    };
  }

  async getDetails() {
    const method = 'getDetails';
    logger.enter(method);

    const tokenAndAccount = await this.getByPartialCompositeKey(this.getCN());
    if (!tokenAndAccount) {
      throw new Error(`Can not found any account by id: ${this.getCN()}`);
    }
    logger.debug('Token and Account: %j', tokenAndAccount);
    const account = tokenAndAccount.find(t => t.model === EARTH_MODEL_ACCOUNT);
    const res = {
      id: account.id,
      name: account.name,
      role: account.role,
      wallet: {},
    };
    const tokens = tokenAndAccount.filter(t => t.model === EARTH_MODEL_WALLET);
    const history = tokenAndAccount.filter(t => t.model === EARTH_MODEL_TX);


    // each token has its tx history
    for (const token of tokens) {
      const txForToken = history.filter(h => h.symbol === token.symbol).map((h) => {
        let { gas, amount, balance } = h;
        if (gas !== undefined && gas !== null) {
          gas = gas.toString();
        }
        if (amount !== undefined && amount !== null) {
          amount = amount.toString();
        }
        if (balance !== undefined && balance !== null) {
          balance = balance.toString();
        }

        return {
          from: h.from,
          to: h.to,
          txId: h.txId,
          description: h.description,
          amount,
          balance,
          gas,
          type: h.type,
          timestamp: h.timestamp,
        };
      }).sort((a, b) => {
        const timestampa = new Date(a.timestamp);
        const timestampb = new Date(b.timestamp);
        if (timestampa > timestampb) {
          return -1;
        }
        return 1;
      });
      res.wallet[token.symbol] = {
        amount: token.amount.toString(),
        // decimals: token.decimals.toString(),
        tokenName: token.tokenName,
        symbol: token.symbol,
        history: txForToken,
      };
    }

    return res;
  }
}

module.exports = Account;
