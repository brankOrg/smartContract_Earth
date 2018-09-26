const Token = require('../model/Token');
const Wallet = require('../model/Wallet');
const Account = require('../model/Account');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('WalletHandler');
const Constants = require('../utils/Constants');
const SchemaCheker = require('../utils/SchemaChecker');
const util = require('util');
const ProposalService = require('../acl/ProposalService');
const { calculateGasOrRam } = require('../utils/GasAndRam');

function getTransferTokenRequestFromParams(params) {
  const method = 'getTransferTokenRequestFromParams';
  logger.enter(method);
  if (!params) {
    logger.error('%s - Transfer Token requires params of length 1, found null', method);
    throw new Error('Transfer new Token requires params of length 1');
  }
  logger.debug('%s - Transfer Token with params %j', method, params);
  if (params.length !== 1) {
    logger.error('%s - Transfer Token requires params of length 1, found %s, %j', method, params.length, params);
    throw new Error('Transfer Token requires params of length 1');
  }
  let transferTokenRequest;
  try {
    transferTokenRequest = JSON.parse(params[0]);
  } catch (e) {
    logger.error('Can not parse request params[0] to a transferTokenRequest Object. params[0]:%j', params[0]);
    logger.error(e);
    throw e;
  }

  const schema = [
    { name: 'symbol', type: 'string', required: true },
    { name: 'target', type: 'string', required: true },
    { name: 'amount', type: 'ufloat', required: true },
    { name: 'description', type: 'string', required: false },
    { name: 'from', type: 'string', required: false },
  ];

  SchemaCheker.check(schema, transferTokenRequest);

  return transferTokenRequest;
}

class WalletHandler {
  /**
   *
   * @param stub
   * @param params [to, name, amount]
   * @return {Promise<*>}
   */
  static async Transfer(stub, params) {
    const method = 'Transfer';
    try {
      logger.enter(method);
      const transferTokenRequest = getTransferTokenRequestFromParams(params);

      logger.debug('%s - Transfer Token with options %o', method, transferTokenRequest);

      // get the information of BASE_TOKEN
      const baseToken = new Token(stub);
      baseToken.buildKey(Constants.BASE_TOKEN.symbol);
      const baseTokenInfo = await baseToken.getOne();
      if (!baseTokenInfo) {
        throw new Error('BASE_TOKEN for earth blockchain app is not created, please contract the admin to perform symtem init');
      }
      const { gasAccountId: baseTokenGasAccountId, decimals: baseTokenDecimals } = baseTokenInfo;

      // get the information of this token
      const token = new Token(stub);
      token.buildKey(transferTokenRequest.symbol);
      const tokenInfo = await token.getOne();
      if (!tokenInfo) {
        throw new Error(util.format('Can not found a token with name %s', transferTokenRequest.symbol));
      }
      logger.debug('%s - Get token info: %j', method, tokenInfo);

      const {
        decimals, gasAccountId, ramAccountId, gasMin, gasPercentage, ramMin, ramPercentage, name,
      } = tokenInfo;
      // 0. calculate gas and ram
      let gas = calculateGasOrRam(gasMin, gasPercentage, transferTokenRequest.amount, decimals);

      logger.info('%s - Tx Gas cost is %s', method, gas);
      logger.debug('\ngasAccount: %s gas:%s \n', gasAccountId, gas);

      const account = new Account(stub);
      let from = account.getCN();
      if (transferTokenRequest.from) {
        const proposalService = new ProposalService(stub);
        const invoker = proposalService.getInvoker();
        const accountKey = stub.createCompositeKey(Constants.CONTRACT_PREFIX, [invoker]);
        const contractAccountId = (await stub.getState(accountKey)).toString('utf8');
        logger.debug(
          '%s - Contract %s has Contract Account Id:%s, transferReq.from:%s',
          method, invoker, contractAccountId, transferTokenRequest.from,
        );
        if (transferTokenRequest.from === contractAccountId) {
          // eslint-disable-next-line prefer-destructuring
          from = transferTokenRequest.from;
        } else {
          throw new Error(util.format(
            '%s - from:%s does not match the contract\'s contractAccount:%s',
            method, transferTokenRequest.from, contractAccountId,
          ));
        }
      }

      // transfer token from gasAccount to another account don't calculate gas
      if (from === gasAccountId) {
        logger.info('%s - transfer token from gas account [%s] to target [%s]', method, gasAccountId, transferTokenRequest.target);
        gas = 0;
      }

      // 1. spend tx at from wallet
      logger.debug('1. spend tx at from wallet, from:%s', from);
      const fromWallet = new Wallet(stub, from);
      const spendTx = {
        from,
        type: Constants.TX_TYPE_SPEND,
        to: transferTokenRequest.target,
        tokenName: name,
        symbol: transferTokenRequest.symbol,
        amount: transferTokenRequest.amount,
        description: transferTokenRequest.description || null,
        gas,
      };
      logger.debug('%s - spendTx: %j', method, spendTx);
      await fromWallet.doTransaction(spendTx);
      // 2. earn tx at to wallet
      logger.debug('2. earn tx at to wallet');
      delete spendTx.gas;
      const toWallet = new Wallet(stub, transferTokenRequest.target);
      spendTx.type = Constants.TX_TYPE_EARN;
      await toWallet.doTransaction(spendTx);
      // 3. earn tx at gas wallet
      if (from !== gasAccountId) {
        logger.debug('%s - 3. earn tx at gas wallet', method);
        const gasWallet = new Wallet(stub, gasAccountId);
        spendTx.amount = gas;
        spendTx.to = gasAccountId;
        spendTx.description = `[token:${transferTokenRequest.symbol}] gas for tx ${stub.getTxID()}`;
        await gasWallet.doTransaction(spendTx);
      }
      logger.debug('Check if the tx is BASE_TOKEN?');
      // if the tx token is not BASE_TOKEN, then we should calculate ram for this tx
      if (transferTokenRequest.symbol !== Constants.BASE_TOKEN.symbol) {
        logger.debug('no, calculate ram');
        const ram = calculateGasOrRam(ramMin, ramPercentage, transferTokenRequest.amount, baseTokenDecimals);
        logger.debug('\nramAccount: %s ram:%s \n', ramAccountId, ram);
        // 4. ram wallet spend ram for this tx
        const ramTx = {
          from: ramAccountId,
          type: Constants.TX_TYPE_SPEND,
          to: baseTokenGasAccountId,
          tokenName: Constants.BASE_TOKEN.name,
          symbol: Constants.BASE_TOKEN.symbol,
          amount: ram,
          description: `[token:${transferTokenRequest.symbol}] ram for tx ${stub.getTxID()}`,
          gas: 0,
        };
        const ramWallet = new Wallet(stub, ramAccountId);
        try {
          await ramWallet.doTransaction(ramTx);
        } catch (e) {
          if (e.message === 'Do not have enough Token for this transaction') {
            throw new Error(util.format(
              '[no enough ram], Do not have enough %s for this tx, please contract your admin',
              Constants.BASE_TOKEN.name,
            ));
          }
          logger.error(e.message);
          throw e;
        }
        // 5. baseTokenGasAccount earn ram
        const baseTokenGasAccount = new Wallet(stub, baseTokenGasAccountId);
        ramTx.type = Constants.TX_TYPE_EARN;
        await baseTokenGasAccount.doTransaction(ramTx);
      }
      logger.debug('%s - done.', method);

      logger.exit(method);
      return Response(true, {
        balance: fromWallet.amount,
        gas,
      });
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  static async GetGas(stub, params) {
    const method = 'Transfer';
    try {
      logger.enter(method);
      logger.debug('%s - params: %j', method, params);
      if (params.length !== 1) {
        throw new Error('GetGas required params of length 1');
      }

      const req = JSON.parse(params[0]);

      const token = new Token(stub);
      token.buildKey(req.symbol);
      const tokenInfo = await token.getOne();
      if (!tokenInfo) {
        throw new Error(util.format('Can not found a token with name %s', req.symbol));
      }
      logger.debug('%s - Get token info: %j', method, tokenInfo);

      const { decimals, gasMin, gasPercentage } = tokenInfo;
      // calculate gas and ram
      const gas = calculateGasOrRam(gasMin, gasPercentage, req.amount, decimals);
      logger.debug('%s - calculate gas for token %s with amount: %s and get response: %s', method, req.symbol, req.amount, gas);
      return Response(true, {
        gas,
        token: req.symbol,
        amount: req.amount,
      });
    } catch (e) {
      logger.error('%s - Error: %s', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = WalletHandler;
