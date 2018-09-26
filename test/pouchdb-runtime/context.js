/* eslint-disable no-underscore-dangle,prefer-destructuring,no-restricted-syntax,no-await-in-loop,class-methods-use-this */
const logger = require('../../lib/utils/Logger').getLogger('Context');
const utf8 = require('utf8');

const MIN_UNICODE_RUNE_VALUE = '\u0000';
const MAX_UNICODE_RUNE_VALUE = '\u{10ffff}';
const COMPOSITEKEY_NS = '\x00';

function validateCompositeKeyAttribute(attr) {
  if (!attr || typeof attr !== 'string' || attr.length === 0) {
    throw new Error('object type or attribute not a non-zero length string');
  }
  utf8.decode(attr);
}

class Context {
  constructor(db) {
    this.db = db;
    this.writeCache = new Map();
    this.deleteCache = [];
  }

  async commit() {
    logger.debug('Commit writeCache to db, current writeCache size: %d', this.writeCache.size);
    for (const key of this.writeCache.keys()) {
      const value = this.writeCache.get(key);
      const doc = Object.assign({ _id: key }, value);
      try {
        let _rev = null;
        try {
          const oldValue = await this.db.get(key);
          _rev = oldValue._rev;
        } catch (e) {
          if (e.status !== 404) {
            throw e;
          }
        }
        if (_rev) {
          doc._rev = _rev;
        }
        // eslint-disable-next-line no-await-in-loop
        const res = await this.db.put(doc);
        logger.debug('PouchDB response is %j', res);
        if (!res.ok) {
          throw new Error(res.rev);
        }
      } catch (e) {
        logger.error(e);
      }
    }
    logger.debug('Commit deleteCache to db, current deleteCache size: %d', this.deleteCache.length);
    for (const key of this.deleteCache) {
      try {
        const doc = await this.db.get(key);
        const res = await this.db.remove(doc);
        logger.debug('Successfully removed %s from db, \nResponse:\n%j\n', key, res);
      } catch (e) {
        if (e.status !== 404) {
          throw e;
        }
        throw new Error(`Can not found item with key ${key}`);
      }
    }
  }

  createCompositeKey(objectType, attributes) {
    validateCompositeKeyAttribute(objectType);
    if (!Array.isArray(attributes)) {
      throw new Error('attributes must be an array');
    }
    let compositeKey = COMPOSITEKEY_NS + objectType + MIN_UNICODE_RUNE_VALUE;
    attributes.forEach((attribute) => {
      validateCompositeKeyAttribute(attribute);
      compositeKey = compositeKey + attribute + MIN_UNICODE_RUNE_VALUE;
    });
    return compositeKey;
  }

  splitCompositeKey(compositeKey) {
    const result = { objectType: null, attributes: [] };
    if (compositeKey && compositeKey.length > 1 && compositeKey.charAt(0) === COMPOSITEKEY_NS) {
      const splitKey = compositeKey.substring(1).split(MIN_UNICODE_RUNE_VALUE);
      if (splitKey[0]) {
        result.objectType = splitKey[0];
        splitKey.pop();
        if (splitKey.length > 1) {
          splitKey.shift();
          result.attributes = splitKey;
        }
      }
    }
    return result;
  }

  async handleGetState(key) {
    try {
      const res = await this.db.get(key);
      delete res._id;
      delete res._rev;
      const content = JSON.stringify(res);
      if (!content) {
        return Buffer.from('');
      }
      return Buffer.from(content);
    } catch (e) {
      if (e.status === 404) {
        return Buffer.from('');
      }
      logger.error('getState error: %O', e);
      throw e;
    }
  }

  async handlePutState(key, value) {
    this.writeCache.set(key, value);
  }

  async handleGetStateByPartialCompositeKey(key, attributes) {
    const partialCompositeKey = this.createCompositeKey(key, attributes);
    return this.handleGetStateByRange(partialCompositeKey, partialCompositeKey + MAX_UNICODE_RUNE_VALUE);
  }

  async handleGetStateByRange(start, end) {
    logger.debug('handle get state by range, start: %s, end: %s', start, end);
    const res = await this.db.find({
      selector: { _id: { $gte: start, $lte: end } },
    });
    logger.debug('RangeQuery getResponse of %d docs', res.docs.length);
    return res.docs;
  }

  async handleGetQueryResult(query) {
    logger.debug('handle GetQueryResult, query: %s', query);
    const queryObject = JSON.parse(query);
    const res = await this.db.find(queryObject);
    logger.debug('GetQueryResult Response %j', res);
    return res.docs;
  }

  async handleDeleteState(key) {
    logger.debug('handle Delete State, key: %s', key);
    this.deleteCache.push(key);
  }
}

module.exports = Context;
