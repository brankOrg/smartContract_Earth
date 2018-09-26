const Token = require('../model/Token');
const Response = require('../utils/Response');
const logger = require('../utils/Logger').getLogger('handler');
const Constants = require('../utils/Constants');

function getCreateTokenRequestFromParams(params) {
  const method = 'getCreateTokenRequestFromParams';
  logger.enter(method);
  if (!params) {
    logger.error('%s - Create new Token requires params of length 1, found null', method);
    throw new Error('Create new Token requires params of length 1');
  }
  logger.debug('%s - Create new Token with params %j', method, params);
  if (params.length !== 1) {
    logger.error('%s - Create new Token requires params of length 1, found %s, %j', method, params.length, params);
    throw new Error('Create new Token requires params of length 1');
  }
  let createTokenRequest;
  try {
    createTokenRequest = JSON.parse(params[0]);
  } catch (e) {
    logger.error('Can not parse request params[0] to a createTokenRequest Object. params[0]:%j', params[0]);
    logger.error(e);
    throw e;
  }
  return createTokenRequest;
}


class TokenHandler {
  static async Init(stub, params) {
    const method = 'InitToken';
    try {
      logger.enter(method);
      const createTokenRequest = getCreateTokenRequestFromParams(params);

      logger.debug('%s - Create new Token with options %j', method, createTokenRequest);
      const token = new Token(stub);
      await token.init(createTokenRequest);
      logger.debug('%s - Successfully Init %s in bc, response: %s', method, Constants.BASE_TOKEN.name, token.toString());

      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  // params: [name, symbol, decimals, amount, description]
  static async Create(stub, params) {
    const method = 'Create';
    try {
      logger.enter(method);
      const createTokenRequest = getCreateTokenRequestFromParams(params);

      logger.debug('%s - Create new Token with options %j', method, createTokenRequest);
      const token = new Token(stub);
      await token.create(createTokenRequest);
      logger.debug('%s - Successfully created new Token in bc, response: %s', method, token.toString());
      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  /**
   * GetTokenInfo returns the basic info of this token
   *
   * @param stub
   * @param params
   * @returns {Promise<void>}
   */
  static async GetTokenInfo(stub, params) {
    const method = 'GetTokenInfo';
    try {
      logger.enter(method);
      if (params.length !== 1) {
        logger.error('%s - Query Token Info requires params of length 1, found %s, %j', method, params.length, params);
        return Response(false, 'GetTokenInfo requires params of length 1');
      }

      const token = new Token(stub);
      token.buildKey(params[0]);
      await token.getOne();
      logger.debug('%s - Successfully created new Token in bc, response: %s', method, token.toString());
      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }

  static async Update(stub, params) {
    const method = 'Update';
    try {
      logger.enter(method);
      const updateTokenReq = getCreateTokenRequestFromParams(params);

      const token = new Token(stub);
      await token.update(updateTokenReq);
      logger.debug('%s - Successfully updated Token %s in bc, response: %s', method, token.symbol, token.toString());
      return Response(true, token.toString());
    } catch (e) {
      logger.error('%s - Error: %o', method, e);
      return Response(false, e.message);
    }
  }
}

module.exports = TokenHandler;
