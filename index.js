/* eslint-disable class-methods-use-this */
const shim = require('fabric-shim');

const logger = require('./lib/utils/Logger').getLogger('Earth:index.js');
const Response = require('./lib/utils/Response');

const AccountHandler = require('./lib/handler/AccountHandler');
const TokenHandler = require('./lib/handler/TokenHandler');
const WalletHandler = require('./lib/handler/WalletHandler');

const Stub = require('./lib/stub');

class Chaincode {
  async Init(stub) {
    logger.debug('############## Init Start ##############');
    const method = 'init';
    const myStub = new Stub(stub);
    logger.enter(method);
    const { params } = myStub.getFunctionAndParameters();
    logger.debug('%s - call Init with params %j', method, params);
    try {
      if (params[0] === 'upgrade') {
        logger.info('Successfully upgrade chaincode');
        return Response(true, 'Success Updated');
      }
      logger.debug('Create init Admin Account');
      return AccountHandler.InitAdmin(myStub);
    } catch (e) {
      return Response(false, e.message);
    }
  }

  async Invoke(stub) {
    logger.debug('############## Invoke Start ##############');
    const myStub = new Stub(stub);
    const {
      fcn,
      params,
    } = myStub.getFunctionAndParameters();
    logger.debug('Invoke with fcn:%s and params:%j', fcn, params);
    switch (fcn) {
      case 'account.getInfo':
        return AccountHandler.GetAccountInfo(myStub, params);
      case 'account.create':
        return AccountHandler.Create(myStub, params);
      case 'account.query':
        return AccountHandler.GetAccount(myStub, params);
      case 'account.update':
        return AccountHandler.UpdateAccount(myStub, params);
      case 'wallet.transfer':
        return WalletHandler.Transfer(myStub, params);
      case 'wallet.getGas':
        return WalletHandler.GetGas(myStub, params);
      case 'token.getInfo':
        return TokenHandler.GetTokenInfo(myStub, params);
      case 'token.create':
        return TokenHandler.Create(myStub, params);
      case 'token.init':
        return TokenHandler.Init(myStub, params);
      case 'token.update':
        return TokenHandler.Update(myStub, params);
      default:
        return shim.error(Buffer.from(`${fcn} is not a valid function name`));
    }
  }
}

shim.start(new Chaincode());
