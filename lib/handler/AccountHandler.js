/* eslint-disable no-case-declarations */
const Account = require('../model/Account');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const ProposalService = require('../acl/ProposalService');
const {
  EARTH_ACCOUNT_TYPE_USER, EARTH_ACCOUNT_TYPE_CONTRACT, EARTH_ACCOUNT_TYPE_ADMIN, CONTRACT_PREFIX,
} = require('../utils/Constants');
const SchemaCheker = require('../utils/SchemaChecker');

function getCreateAccountRequest(params) {
  const method = 'getCreateAccountRequest';
  if (!params) {
    logger.error('%s - Create new Account requires found %o', method, params);
    throw new Error('Create new Account requires params');
  }
  if (params.length !== 1) {
    logger.error('%s - Create new Account requires params of length 1, found %s, %j', method, params.length, params);
    throw new Error('Create new Account requires params of length 1');
  }

  let createAccountRequest;
  try {
    createAccountRequest = JSON.parse(params[0]);
  } catch (e) {
    logger.error('Can not parse request params[0] to a createAccountRequest Object. params[0]:%j, type: %s', params[0], typeof params[0]);
    logger.error(e);
    throw e;
  }

  const schema = [
    { name: 'id', type: 'string', required: true },
    { name: 'name', type: 'string', required: true },
    { name: 'role', type: 'string', required: false },
  ];

  SchemaCheker.check(schema, createAccountRequest);
  if (!createAccountRequest.role) {
    logger.debug('No role defined, create user account');
    createAccountRequest.role = EARTH_ACCOUNT_TYPE_USER;
  }

  return createAccountRequest;
}

async function createUserAccount(stub, request) {
  const method = 'AccountHandler.createUserAccount';

  try {
    logger.debug('%s - Create new "user" Account with request: %j', method, request);
    const account = new Account(stub);
    await account.create(request);
    logger.debug('%s - Successfully create new Account in bc, response: %s', method, account.toString());
    return Response(true, account.toString());
  } catch (e) {
    logger.error(e.message);
    return Response(false, e.message);
  }
}

async function createContractAccount(stub, request) {
  const method = 'AccountHandler.createContractAccount';
  logger.debug('%s - Create new Contract Account with options %j', method, request);

  try {
    const proposalService = new ProposalService(stub);
    const invoker = proposalService.getInvoker();
    logger.debug('%s - Create contract account, invoker: %s', method, invoker);
    if (!invoker) {
      throw new Error('The request for create contract account must comes from the contract');
    }
    /**
     * save this contract account info
     * key: contract's chaincodeId
     * val: contract's accountId
     */
    const accountKey = stub.createCompositeKey(CONTRACT_PREFIX, [invoker]);
    await stub.putState(accountKey, Buffer.from(request.id));
    const account = new Account(stub);
    await account.create(request);
    logger.debug('%s - Successfully create new Account in bc, response: %s', method, account.toString());
    return Response(true, account.toString());
  } catch (e) {
    logger.error(e.message);
    return Response(false, e.message);
  }
}

class AccountHandler {
  static async InitAdmin(stub) {
    const method = 'InitAdmin';
    try {
      logger.enter(method);
      const bootstrapUser = {
        id: 'admin',
        role: 'admin',
        name: 'Earth BlockChain Bootstrap User',
        bootstrap: true,
      };
      const account = new Account(stub);
      await account.init(bootstrapUser);
      return Response(true, account.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // params[0]: stringified {id, name, role(optional)}
  static async Create(stub, params) {
    const method = 'Create';
    try {
      logger.enter(method);

      const opts = getCreateAccountRequest(params);

      switch (opts.role) {
        case EARTH_ACCOUNT_TYPE_ADMIN:
          throw new Error('can not create admin account');
        case EARTH_ACCOUNT_TYPE_USER:
          return createUserAccount(stub, opts);
        case EARTH_ACCOUNT_TYPE_CONTRACT:
          return createContractAccount(stub, opts);
        default:
          throw new Error(`Unsupported account type ${opts.role}`);
      }
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  /**
   * this only returns the basic info of this account.
   * id, role, name
   *
   * @param stub
   * @param params this should be an empty string array
   * @returns {Promise<*>}
   * @constructor
   */
  static async GetAccountInfo(stub, params) {
    const method = 'GetAccountInfo';
    try {
      logger.enter(method);
      if (params.length !== 0) {
        logger.error('%s - Query Account requires params of length 0, found %s, %j', method, params.length, params);
        return Response(false, 'Create new Account requires params of length 0');
      }
      logger.debug('%s - Query Account', method);
      let account = new Account(stub);
      account = await account.getOne();
      logger.debug('%s - Successfully get Account from bc, response: %s', method, account.toString());
      logger.exit(method);
      return Response(true, account.toJSON());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  static async GetAccount(stub, params) {
    const method = 'GetAccount';
    try {
      logger.enter(method);
      if (params.length !== 0) {
        logger.error('%s - Query Account requires params of length 0, found %s, %j', method, params.length, params);
        return Response(false, 'Create new Account requires params of length 0');
      }
      logger.debug('%s - Query Account', method);
      const account = new Account(stub);
      const details = await account.getDetails();
      logger.debug('%s - Successfully get Account from bc, response: %j', method, details);
      logger.exit(method);
      return Response(true, details);
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  /**
   * UpdateAccount will update another user account to admin
   *
   * @param stub
   * @param params
   * @returns {Promise<*>}
   * @constructor
   */
  static async UpdateAccount(stub, params) {
    const method = 'UpdateAccount';
    try {
      logger.enter(method);
      if (params.length !== 1) {
        logger.error('%s - Update Account requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'Update Account requires params of length 1');
      }
      logger.debug('%s - Update Account %s', method, params[0]);
      const account = new Account(stub);
      const updateReq = {
        id: params[0],
      };
      await account.update(updateReq);
      logger.debug('%s - Successfully Updated Account at bc, response: %s', method, account.toString());
      logger.exit(method);
      return Response(true, {
        updated: params[0],
      });
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = AccountHandler;
