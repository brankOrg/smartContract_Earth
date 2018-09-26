const logger = require('../utils/Logger').getLogger('Wallet');
const Transaction = require('./Transaction');

const SchemaCheker = require('../utils/SchemaChecker');
const {
  ACCOUNT_PREFIX, EARTH_MODEL_WALLET, TX_TYPE_EARN, TX_TYPE_MINTAGE, TX_TYPE_SPEND,
} = require('../utils/Constants');
const BaseModel = require('./BaseModel');
const math = require('mathjs');
const { checkDecimals } = require('../utils/GasAndRam');

/**
 * Account Wallet.
 * - Each account is associated to several wallets
 * - Each token was associated to one wallet
 *
 * Data schema for Wallet is:
 * - token: string
 * - amount: number
 * - decimals: number
 */
class Wallet extends BaseModel {
  constructor(stub, accountId) {
    super(stub);
    this.prefix = ACCOUNT_PREFIX;
    this.model = EARTH_MODEL_WALLET;
    this.accountId = accountId;
  }

  toJSON() {
    return {
      tokenName: this.tokenName,
      symbol: this.symbol,
      amount: this.amount,
      decimals: this.decimals,
      model: this.model,
    };
  }

  async validateOptions(method, options) {
    switch (method) {
      case 'transfer':
        await this.checkTransferOptions(options);
        break;
      default:
        logger.warn('no \'validateOptions\' implementation found for function %s', method);
    }
  }

  async checkPermission(method, options) {
    switch (method) {
      case 'transfer':
        await this.checkTransferPermission(options);
        break;
      default:
        logger.warn('no \'validateOptions\' implementation found for function %s', method);
    }
  }

  doCreate(options) {
    if (options.type === TX_TYPE_SPEND) {
      this.buildKey(options.from, options.symbol);
    } else {
      this.buildKey(options.to, options.symbol);
    }
    this.symbol = options.symbol;
    this.tokenName = options.tokenName;
    this.amount = options.amount;
    this.decimals = options.decimals;
  }

  async doTransaction(tx) {
    const method = 'transfer';
    try {
      logger.enter(method);
      await this.validateOptions(method, tx);
      await this.checkPermission(method, tx);

      let wallet;

      switch (tx.type) {
        case TX_TYPE_MINTAGE:
          this.buildKey(tx.to, tx.symbol);
          await this.create(tx);
          break;
        case TX_TYPE_EARN:
          this.buildKey(tx.to, tx.symbol);
          wallet = await this.getOne();
          if (!wallet) {
            await this.create(tx);
          } else {
            this.add(tx.amount);
            await this.save();
          }
          break;
        case TX_TYPE_SPEND:
          this.buildKey(tx.from, tx.symbol);
          wallet = await this.getOne();
          if (!wallet) {
            throw new Error('Do not have enough Token for this transaction');
          }
          this.minus(tx.amount + tx.gas);
          await this.save();
          break;
        default:
          throw new Error('Unsupported transaction type');
      }


      // add history record
      const transaction = new Transaction(this.stub);
      await transaction.create({
        accountId: this.accountId,
        from: tx.from,
        to: tx.to,
        tokenName: tx.tokenName,
        symbol: tx.symbol,
        amount: tx.amount,
        balance: this.amount,
        description: tx.description,
        type: tx.type,
        gas: tx.gas,
      });

      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }


  minus(amount) {
    const method = 'minus';
    try {
      logger.enter(method);
      logger.debug('%s - minus amount %s, current %s, have enough token:%s', method, amount, this.amount, amount < this.amount);

      if (amount > this.amount) {
        throw new Error('Do not have enough token');
      }
      checkDecimals(amount, this.decimals);
      this.amount = math.subtract(math.bignumber(this.amount), math.bignumber(amount)).toNumber();
      logger.debug('%s - After minus there are %s tokens', method, this.amount);
      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }

  add(amount) {
    const method = 'add';
    try {
      logger.enter(method);
      logger.debug('%s - add amount %s current %s', method, amount, this.amount);
      checkDecimals(amount, this.decimals);
      this.amount = math.add(math.bignumber(this.amount), math.bignumber(amount)).toNumber();

      logger.debug('%s - After add there are %s tokens', method, this.amount);

      logger.exit(method);
    } catch (e) {
      logger.error('%s - Error: %s', method, e.message);
      throw e;
    }
  }


  // eslint-disable-next-line class-methods-use-this
  checkTransferOptions(tx) {
    const fields = [
      { name: 'from', type: 'string', required: true },
      { name: 'type', type: 'string', required: true },
      { name: 'to', type: 'string', required: true },
      { name: 'tokenName', type: 'string', required: true },
      { name: 'symbol', type: 'string', required: true },
      { name: 'amount', type: 'ufloat', required: true },
      { name: 'description', type: 'string', required: false },
    ];

    if (tx.type === TX_TYPE_SPEND) {
      fields.push({ name: 'gas', type: 'ufloat', required: true });
      fields.push({ name: 'ram', type: 'ufloat', required: false });
    }

    SchemaCheker.check(fields, tx);
    if (tx.to === tx.from) {
      throw new Error('Can not transfer token to oneself');
    }
  }

  checkTransferPermission(tx) {
    if (tx.type === TX_TYPE_EARN) {
      return;
    }
    logger.debug('check permission for tx:%j with CN:%s', tx, this.getCN());
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
}

module.exports = Wallet;
