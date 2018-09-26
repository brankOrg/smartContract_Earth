const Pouchdb = require('pouchdb');
const pouchdbAdapter = require('pouchdb-adapter-memory');
const pouchdbFind = require('pouchdb-find');
const Context = require('./context');
const ChaincodeStub = require('./stub');


const logger = require('../../lib/utils/Logger').getLogger('Runtime');

Pouchdb.plugin(pouchdbAdapter);
Pouchdb.plugin(pouchdbFind);

class Runtime {
  constructor() {
    logger.debug('Create new Runtime Instance');
    const db = new Pouchdb('cornet', { adapter: 'memory' });
    this.db = db;
    this.stub = new ChaincodeStub();
  }

  async invoke(handler, params) {
    const ctx = new Context(this.db);
    this.stub.setCtx(ctx);

    const response = await handler(this.stub, params);
    if (response.status === 500) {
      response.message = response.message.toString('utf8');
    } else if (response.status === 200) {
      response.payload = response.payload.toString('utf8');
      await ctx.commit();
    }

    return response;
  }

  async stop() {
    await this.db.destroy();
  }
}

module.exports = Runtime;
