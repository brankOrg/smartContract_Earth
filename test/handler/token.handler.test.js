const TokenHandler = require('../../lib/handler/TokenHandler');
const AccountHandler = require('../../lib/handler/AccountHandler');
const Runtime = require('../pouchdb-runtime/runtime-pouchdb');
const chai = require('chai');
const chaiPromised = require('chai-as-promised');
const { users } = require('../fixtures/mock-data');

const { user0, user1, user2, user3 } = users;

chai.use(chaiPromised);
chai.should();

describe('Test Token', () => {
  let runtime;
  let resp;

  const baseToken = {
    name: 'GZH',
    symbol: 'GZH',
    decimals: 10,
    model: 'Earth.Token',
    amount: 10000,
    description: 'Base token GZH',
    mintageAccountId: user0.id,
    gasAccountId: user1.id,
    gasMin: 0.01,
    gasPercentage: 0.5,
  };

  const token = {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 10,
    amount: 10000,
    description: 'test token btc',
    mintageAccountId: user0.id,
    gasAccountId: user1.id,
    ramAccountId: user2.id,
    gasMin: 0.1,
    gasPercentage: 0.05,
    ramMin: 0.2,
    ramPercentage: 0.08,
  };

  before(async () => {
    runtime = new Runtime();
    const initAdmin = AccountHandler.InitAdmin;
    await runtime.invoke(initAdmin, []);

    const createAccount = AccountHandler.Create;

    let req = JSON.stringify({
      id: user0.id,
      name: user0.name,
    });
    runtime.stub.setUserCtx(user0.certificate);
    resp = await runtime.invoke(createAccount, [req]);
    resp.status.should.eql(200);
    resp.payload = JSON.parse(resp.payload);
    resp.payload.id.should.equal(user0.id);
    resp.payload.name.should.equal(user0.name);
    resp.payload.role.should.equal('user');
    runtime.stub.cleanUserCtx();

    req = JSON.stringify({
      id: user1.id,
      name: user1.name,
    });
    runtime.stub.setUserCtx(user1.certificate);
    resp = await runtime.invoke(createAccount, [req]);
    resp.status.should.eql(200);
    resp.payload = JSON.parse(resp.payload);
    resp.payload.id.should.equal(user1.id);
    resp.payload.name.should.equal(user1.name);
    resp.payload.role.should.equal('user');
    runtime.stub.cleanUserCtx();

    req = JSON.stringify({
      id: user2.id,
      name: user2.name,
    });
    runtime.stub.setUserCtx(user2.certificate);
    resp = await runtime.invoke(createAccount, [req]);
    resp.status.should.eql(200);
    resp.payload = JSON.parse(resp.payload);
    resp.payload.id.should.equal(user2.id);
    resp.payload.name.should.equal(user2.name);
    resp.payload.role.should.equal('user');
    runtime.stub.cleanUserCtx();
  });

  after(async () => {
    await runtime.stop();
  });

  describe('Init()', () => {
    const handler = TokenHandler.Init;
    const req = baseToken;

    it('Missing required property should response 500', async () => {
      const dummyReq = Object.assign({}, req);
      delete dummyReq.mintageAccountId;

      const resp = await runtime.invoke(handler, [JSON.stringify(dummyReq)]);
      resp.status.should.equal(500);
      resp.message.should.equal('Missing Required property mintageAccountId');
    });

    it('MintageAccount should be different than gasAccount', async () => {
      req.gasAccountId = user0.id;
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.include('MintageAccount and gasAccount should not be same for token GZH');
      req.gasAccountId = user1.id;
    });

    it('Success', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(200);
    });

    it('call init twice should fail', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Token:GZH with symbol:GZH already exists');
    });

    it('get token info', async () => {
      const { GetTokenInfo } = TokenHandler;
      resp = await runtime.invoke(GetTokenInfo, ['GZH']);
      resp.status.should.eql(200);
      const payload = JSON.parse(resp.payload);
      payload.model.should.equal('Earth.Token');
      payload.name.should.eql('GZH');
      payload.symbol.should.eql('GZH');
      payload.decimals.should.eql(10);
      payload.description.should.eql('Base token GZH');
      payload.mintageAccountId.should.eql(user0.id);
      payload.gasAccountId.should.eql(user1.id);
      payload.gasMin.should.eql(0.01);
      payload.gasPercentage.should.eql(0.5);
    });

    it('get user0 info, we should see there are GZH in mintageAccount', async () => {
      const { GetAccount } = AccountHandler;
      runtime.stub.setUserCtx(user0.certificate);
      resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      const payload = JSON.parse(resp.payload);
      payload.id.should.eql(user0.id);
      payload.name.should.eql(user0.name);
      payload.role.should.eql(user0.role);
      payload.wallet.GZH.amount.should.eql('10000');
      // payload.wallet.GZH.decimals.should.eql('10');
      payload.wallet.GZH.history.length.should.eql(1);
      payload.wallet.GZH.history[0].to.should.eql(user0.id);
      payload.wallet.GZH.history[0].amount.should.eql('10000');
      payload.wallet.GZH.history[0].balance.should.eql('10000');

      runtime.stub.cleanUserCtx();
    });
  });

  describe('Create()', () => {
    const handler = TokenHandler.Create;

    it('missing params should response error', async () => {
      const resp = await runtime.invoke(handler);
      resp.status.should.eql(500);
      resp.message.should.eql('Create new Token requires params of length 1');
    });

    it('wrong params length should response error', async () => {
      const resp = await runtime.invoke(handler, ['', '', '']);
      resp.status.should.eql(500);
      resp.message.should.eql('Create new Token requires params of length 1');
    });

    it('dummy identity do not have permission to create a token', async () => {
      runtime.stub.setUserCtx(user1.certificate);
      const resp = await runtime.invoke(handler, [JSON.stringify(token)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Only "Admin" account can create new Token');
      runtime.stub.cleanUserCtx();
    });

    it('Create a new Token with correct options should response success', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify(token)]);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      const exptected = Object.assign({}, token, { model: 'Earth.Token' });
      resp.payload.should.deep.eql(exptected);
    });

    it('Create this Token again should throw error for this token already exist', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify({
        name: 'BTC',
        symbol: 'BTC',
        decimals: 10,
        amount: 10000,
        description: 'test token btc',
        mintageAccountId: user0.id,
        gasAccountId: user1.id,
        ramAccountId: user2.id,
        gasMin: 0.1,
        gasPercentage: 0.05,
        ramMin: 0.2,
        ramPercentage: 0.08,
      })]);
      resp.status.should.eql(500);
      resp.message.should.eql('Token:BTC or symbol:BTC already exists');
    });
  });

  describe('GetTokenInfo()', () => {
    const handler = TokenHandler.GetTokenInfo;
    it('Get the basic info of GZH', async () => {
      const resp = await runtime.invoke(handler, ['GZH']);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.should.deep.eql(baseToken);
    });

    it('Get the basic info of BTC', async () => {
      const resp = await runtime.invoke(handler, ['BTC']);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      const exptected = Object.assign({}, token, { model: 'Earth.Token' });
      resp.payload.should.deep.eql(exptected);
    });
  });

  describe('Update()', () => {
    const handler = TokenHandler.Update;
    const { GetTokenInfo } = TokenHandler;

    it('can not update ram for BASE Token', async () => {
      const req = {
        symbol: 'GZH',
        ramMin: 1.11,
        ramPercentage: 0.1,
      };
      resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Can not update ram for Token GZH');
    });

    it('admin can update token\'s ram', async () => {
      const req = {
        symbol: 'BTC',
        ramMin: 1.11,
        ramPercentage: 0.1,
      };
      resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(200);

      resp = await runtime.invoke(GetTokenInfo, ['BTC']);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.ramMin.should.eql(req.ramMin);
      resp.payload.ramPercentage.should.eql(req.ramPercentage);
    });

    it('admin can not update GZH\'s gas, because admin is not the mintage user0 for GZH', async () => {
      const req = {
        symbol: 'GZH',
        gasMin: 1.11,
        gasPercentage: 0.1,
      };
      resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Only mintage Account of this token can update token\'s gas');
    });

    it('mintageAccount can update token\'s gas', async () => {
      runtime.stub.setUserCtx(user0.certificate);

      const req = {
        symbol: 'GZH',
        gasMin: 1.11,
        gasPercentage: 0.1,
      };
      resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(200);

      resp = await runtime.invoke(GetTokenInfo, ['GZH']);
      resp.status.should.eql(200);

      resp.payload = JSON.parse(resp.payload);
      resp.payload.gasMin.should.eql(req.gasMin);
      resp.payload.gasPercentage.should.eql(req.gasPercentage);
      runtime.stub.cleanUserCtx();
    });
  });
});
