const util = require('util');
const {
  TOKEN_PREFIX, BASE_TOKEN, EARTH_ACCOUNT_TYPE_ADMIN, EARTH_MODEL_TOKEN, TX_TYPE_MINTAGE,
} = require('../utils/Constants');
const logger = require('../utils/Logger').getLogger('Token');
const BaseModel = require('./BaseModel');
const Account = require('./Account');
const Wallet = require('./Wallet');
const SchemaCheker = require('../utils/SchemaChecker');


/**
 * @typedef {Object} CreateTokenOption
 * @property {string} name - Required. The name of the token.
 * @property {string} symbol - Required. The symbol of the token.
 * @property {number} decimals - Required. unsigned int4, value should be 0-16
 * @property {number} amount - Required. unsigned int64
 * @property {string} description - Optional. Can't be changed.
 * @property {string} mintageAccountId - Required. 铸币账户
 * @property {string} gasAccountId - Required. 收到的gas都会存在这个账户
 * @property {string} ramAccountId - Required. 收到的ram都会存在这个账户
 * @property {number} gasMin - Required.
 * @property {number} gasPercentage - Required.
 * @property {number} ramMin - Required.
 * @property {number} ramPercentage - Required.
 */

async function checkAccountsExists(stub, accounts) {
  const account = new Account(stub);
  // eslint-disable-next-line no-restricted-syntax
  for (const accountId of accounts) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await account.exists(accountId);
    if (!exists) {
      logger.error('Account %s does not exist', accountId);
      throw new Error(util.format('Do not exist a mintageAccount with id:%s', accountId));
    }
    logger.debug('account %s exist', accountId);
  }
}

class Token extends BaseModel {
  constructor(stub) {
    super(stub);
    this.prefix = TOKEN_PREFIX;
    this.model = EARTH_MODEL_TOKEN;
  }

  /**
   *
   * @param {CreateTokenOption} options
   */
  async doInit(options) {
    this.key = this.buildKey(options.symbol);
    this.name = options.name;
    this.symbol = options.symbol;
    this.decimals = options.decimals;
    this.amount = options.amount;
    this.description = options.description;
    this.mintageAccountId = options.mintageAccountId;
    this.gasAccountId = options.gasAccountId;
    this.gasMin = options.gasMin;
    this.gasPercentage = options.gasPercentage;

    const wallet = new Wallet(this.stub, this.mintageAccountId);
    await wallet.doTransaction({
      type: TX_TYPE_MINTAGE,
      from: '',
      to: this.mintageAccountId,
      tokenName: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      description: 'mintage token',
      amount: this.amount,
    });
  }

  /**
   * create new token
   * @param {CreateTokenOption} options
   */
  async doCreate(options) {
    this.key = this.buildKey(options.symbol);

    this.name = options.name;
    this.symbol = options.symbol;
    this.decimals = options.decimals;
    this.amount = options.amount;
    this.description = options.description;

    this.mintageAccountId = options.mintageAccountId;
    this.gasAccountId = options.gasAccountId;
    this.ramAccountId = options.ramAccountId;

    this.gasMin = options.gasMin;
    this.gasPercentage = options.gasPercentage;
    this.ramMin = options.ramMin;
    this.ramPercentage = options.ramPercentage;

    const wallet = new Wallet(this.stub, this.mintageAccountId);
    await wallet.doTransaction({
      type: TX_TYPE_MINTAGE,
      from: '',
      to: this.mintageAccountId,
      tokenName: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      description: 'mintage token',
      amount: this.amount,
    });
  }

  async doUpdate(options) {
    this.buildKey(options.symbol);
    const exists = await this.getOne();
    if (!exists) {
      throw new Error('Error update token info, Token with symbol %s does not exist', options.symbol);
    }
    if (options.gasMin || options.gasPercentage) {
      this.gasMin = options.gasMin || this.gasMin;
      this.gasPercentage = options.gasPercentage || this.gasPercentage;
    } else if (options.ramMin || options.ramPercentage) {
      this.ramMin = options.ramMin || this.ramMin;
      this.ramPercentage = options.ramPercentage || this.ramPercentage;
    }
  }


  async validateOptions(fcn, options) {
    switch (fcn) {
      case 'init':
        await this.checkInitOptions(options);
        break;
      case 'create':
        await this.checkCreateOptions(options);
        break;
      case 'update':
        await this.checkUpdateOptions(options);
        break;
      default:
        logger.warn('no \'validateOptions\' implementation found for function %s', fcn);
        // eslint-disable-next-line no-useless-return
        return;
    }
  }

  async checkPermission(fcn, options) {
    switch (fcn) {
      case 'create':
        await this.checkCreatePermission(options);
        break;
      case 'init':
        await this.checkInitPermission(options);
        break;
      case 'update':
        await this.checkUpdatePermission(options);
        break;
      default:
        logger.warn('no \'checkPermission\' implementation found for function %s', fcn);
        // eslint-disable-next-line no-useless-return
        return;
    }
  }

  toJSON() {
    return {
      model: this.model,
      name: this.name,
      symbol: this.symbol,
      decimals: this.decimals,
      amount: this.amount,
      description: this.description,
      mintageAccountId: this.mintageAccountId,
      gasAccountId: this.gasAccountId,
      ramAccountId: this.ramAccountId,
      gasMin: this.gasMin,
      gasPercentage: this.gasPercentage,
      ramMin: this.ramMin,
      ramPercentage: this.ramPercentage,
    };
  }

  async checkInitOptions(options) {
    const fields = [
      { name: 'name', type: 'string', required: true },
      { name: 'symbol', type: 'string', required: true },
      { name: 'decimals', type: 'uint4', required: true },
      { name: 'amount', type: 'uint64', required: true },
      { name: 'description', type: 'string', required: false },

      { name: 'mintageAccountId', type: 'string', required: true },
      { name: 'gasAccountId', type: 'string', required: true },

      { name: 'gasMin', type: 'ufloat', required: true },
      { name: 'gasPercentage', type: 'ufloat', required: true },
    ];

    SchemaCheker.check(fields, options);

    if (options.name !== BASE_TOKEN.name) {
      throw new Error(util.format('Init Token with name=%s is not allowed, expect %s', options.name, BASE_TOKEN.name));
    }
    if (options.symbol !== BASE_TOKEN.symbol) {
      throw new Error(util.format('Init Token with symbol=%s is not allowed, expect %s', options.name, BASE_TOKEN.symbol));
    }

    if (options.mintageAccountId === options.gasAccountId) {
      throw new Error(util.format('MintageAccount and gasAccount should not be same for token %s', options.symbol));
    }

    // check mintageAccount and gasAccountId exists
    await checkAccountsExists(this.stub, [options.mintageAccountId, options.gasAccountId]);

    // check GZH not exists, to make sure we don't call init more than once.
    const exists = await this.exists(options.name, options.symbol);
    if (exists) {
      throw new Error(util.format('Token:%s with symbol:%s already exists', BASE_TOKEN.name, BASE_TOKEN.symbol));
    }
  }

  async checkUpdateOptions(options) {
    const fields = [
      { name: 'symbol', type: 'string', required: true },
      { name: 'gasMin', type: 'ufloat', required: false },
      { name: 'gasPercentage', type: 'ufloat', required: false },
      { name: 'ramMin', type: 'ufloat', required: false },
      { name: 'ramPercentage', type: 'ufloat', required: false },
    ];

    SchemaCheker.check(fields, options);
    if ((options.gasMin || options.gasPercentage) && (options.ramMin || options.ramPercentage)) {
      throw new Error('Can\t update ram and gas at once');
    }
  }

  // eslint-disable-next-line no-unused-vars
  async checkInitPermission(options) {
    let account = new Account(this.stub);
    account = await account.getOne();
    if (account.role !== EARTH_ACCOUNT_TYPE_ADMIN) {
      throw new Error('Current Account do not have permission to perform Init transaction');
    }
  }

  async checkUpdatePermission(options) {
    const account = new Account(this.stub);
    await account.getOne();
    if (options.ramMin || options.ramPercentage) {
      if (options.symbol === BASE_TOKEN.symbol) {
        throw new Error(`Can not update ram for Token ${BASE_TOKEN.symbol}`);
      }
      if (account.role !== EARTH_ACCOUNT_TYPE_ADMIN) {
        throw new Error('Only Admin Account can update token\'s ram');
      }
    } else if (options.gasMin || options.gasPercentage) {
      this.buildKey(options.symbol);
      await this.getOne();
      if (this.mintageAccountId !== this.getCN()) {
        throw new Error('Only mintage Account of this token can update token\'s gas');
      }
    }
  }

  /**
   * For a Token, we need to check that the name and symbol are both unique
   * if name or symbol already exists for some token, return false
   * otherwise return true
   * @param name
   * @param symbol
   */
  async exists(name, symbol) {
    const method = 'exists';
    logger.enter(method);

    const selector = {
      model: EARTH_MODEL_TOKEN,
      $or: [
        { name },
        { symbol },
      ],
    };

    const query = { selector };

    const queryResults = await this.stub.getQueryResult(JSON.stringify(query));
    logger.debug(queryResults);
    return queryResults.length !== 0;
  }

  /**
   * Check if the options is a valid {@link CreateTokenOption} object
   *
   * @param {CreateTokenOption} options
   * @throws Error if some check failed.
   */
  async checkCreateOptions(options) {
    const fields = [
      { name: 'name', type: 'string', required: true },
      { name: 'symbol', type: 'string', required: true },
      { name: 'decimals', type: 'uint4', required: true },
      { name: 'amount', type: 'uint64', required: true },
      { name: 'description', type: 'string', required: false },

      { name: 'mintageAccountId', type: 'string', required: true },
      { name: 'gasAccountId', type: 'string', required: true },
      { name: 'ramAccountId', type: 'string', required: true },

      { name: 'gasMin', type: 'ufloat', required: true },
      { name: 'gasPercentage', type: 'ufloat', required: true },
      { name: 'ramMin', type: 'ufloat', required: true },
      { name: 'ramPercentage', type: 'ufloat', required: true },
    ];

    SchemaCheker.check(fields, options);

    // TODO: should gasPercentage/ramPercentage less than 100?

    // if (options.gasPercentage > 100) {
    //   throw new Error('gasPercentage should be a number less than 100');
    // }
    // if (options.ramPercentage > 100) {
    //   throw new Error('ramPercentage should be a number less than 100');
    // }

    if (options.mintageAccountId === options.gasAccountId) {
      throw new Error(util.format('MintageAccount and gasAccount should not be same for token %s', options.symbol));
    }

    // check mintageAccount and gasAccountId exists
    await checkAccountsExists(this.stub, [options.mintageAccountId, options.gasAccountId, options.ramAccountId]);

    // check this token does not exists
    const exists = await this.exists(options.name, options.symbol);
    if (exists) {
      throw new Error(util.format('Token:%s or symbol:%s already exists', options.name, options.symbol));
    }
  }

  // eslint-disable-next-line no-unused-vars
  async checkCreatePermission(options) {
    const account = new Account(this.stub);
    await account.getOne();
    if (account.role !== EARTH_ACCOUNT_TYPE_ADMIN) {
      throw new Error(util.format('Only "Admin" account can create new Token'));
    }
  }
}

module.exports = Token;
