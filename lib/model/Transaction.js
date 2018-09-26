const BaseModel = require('./BaseModel');
const { ACCOUNT_PREFIX, EARTH_MODEL_TX } = require('../utils/Constants');
const SchemaCheker = require('../utils/SchemaChecker');
const logger = require('../utils/Logger').getLogger('Wallet');
const getTimeStamp = require('../utils/TimeStamp');

/**
 * Transaction is used to save a token doTransaction record.
 */
class Transaction extends BaseModel {
  constructor(stub) {
    super(stub);
    this.prefix = ACCOUNT_PREFIX;
    this.model = EARTH_MODEL_TX;
  }

  async doCreate(options) {
    const txId = this.stub.getTxID();
    this.buildKey(options.accountId, options.symbol, txId);
    Object.assign(this, options);
    this.timestamp = getTimeStamp(this.stub);
    logger.info('Create Transaction Record for tx:%s', txId);
  }

  async validateOptions(method, options) {
    switch (method) {
      case 'create':
        Transaction.checkCreateOptions(options);
        break;
      default:
    }
  }

  // eslint-disable-next-line no-unused-vars
  async checkPermission(method, options) {
    switch (method) {
      case 'create':
        break;
      default:
        break;
    }
  }

  static checkCreateOptions(options) {
    const fields = [
      { name: 'accountId', type: 'string', required: true },
      { name: 'from', type: 'string', required: true },
      { name: 'to', type: 'string', required: true },
      { name: 'tokenName', type: 'string', required: true },
      { name: 'symbol', type: 'string', required: true },
      { name: 'type', type: 'string', required: true },
      { name: 'amount', type: 'ufloat', required: true },
      { name: 'balance', type: 'ufloat', required: true },
      { name: 'description', type: 'string', required: false },
    ];

    SchemaCheker.check(fields, options);
  }

  toJSON() {
    return {
      txId: this.stub.getTxID(),
      from: this.from,
      to: this.to,
      tokenName: this.tokenName,
      symbol: this.symbol,
      amount: this.amount,
      balance: this.balance,
      description: this.description,
      model: this.model,
      gas: this.gas || null,
      type: this.type,
      timestamp: this.timestamp,
    };
  }
}

module.exports = Transaction;
