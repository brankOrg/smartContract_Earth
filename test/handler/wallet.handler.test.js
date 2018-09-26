const TokenHandler = require('../../lib/handler/TokenHandler');
const AccountHandler = require('../../lib/handler/AccountHandler');
const WalletHandler = require('../../lib/handler/WalletHandler');
const Runtime = require('../pouchdb-runtime/runtime-pouchdb');
const chai = require('chai');
const chaiPromised = require('chai-as-promised');

const { user0, user1, user2, user3 } = require('../fixtures/mock-data').users;

chai.use(chaiPromised);
chai.should();

describe('Test Wallet', () => {
  let runtime;
  const account = user0;

  const gasAccount = user1;

  const ramAccount = user2;

  const baseToken = {
    name: 'GZH',
    symbol: 'GZH',
    decimals: 10,
    model: 'Earth.Token',
    amount: 10000,
    description: 'Base token GZH',
    mintageAccountId: 'admin',
    gasAccountId: gasAccount.id,
    gasMin: 0.01,
    gasPercentage: 0.5,
  };

  const token = {
    name: 'BTC',
    symbol: 'BTC',
    decimals: 10,
    amount: 20000,
    description: 'test token btc',
    mintageAccountId: account.id,
    gasAccountId: gasAccount.id,
    ramAccountId: ramAccount.id,
    gasMin: 0.1,
    gasPercentage: 0.05,
    ramMin: 0.2,
    ramPercentage: 0.08,
  };

  const { GetAccount } = AccountHandler;

  before(async () => {
    runtime = new Runtime();
    const initAdmin = AccountHandler.InitAdmin;
    let resp = await runtime.invoke(initAdmin, []);
    resp.status.should.eql(200);

    const createAccount = AccountHandler.Create;
    runtime.stub.setUserCtx(account.certificate);
    let req = {
      id: account.id,
      name: account.name,
    };
    resp = await runtime.invoke(createAccount, [JSON.stringify(req)]);
    resp.status.should.eql(200);
    runtime.stub.cleanUserCtx();

    runtime.stub.setUserCtx(ramAccount.certificate);
    req = {
      id: ramAccount.id,
      name: ramAccount.name,
    };
    resp = await runtime.invoke(createAccount, [JSON.stringify(req)]);
    resp.status.should.eql(200);
    runtime.stub.cleanUserCtx();

    runtime.stub.setUserCtx(gasAccount.certificate);
    req = {
      id: gasAccount.id,
      name: gasAccount.name,
    };
    resp = await runtime.invoke(createAccount, [JSON.stringify(req)]);
    resp.status.should.eql(200);
    runtime.stub.cleanUserCtx();

    const initToken = TokenHandler.Init;
    resp = await runtime.invoke(initToken, [JSON.stringify(baseToken)]);
    resp.status.should.eql(200);

    const createToken = TokenHandler.Create;
    resp = await runtime.invoke(createToken, [JSON.stringify(token)]);
    resp.status.should.eql(200);
  });

  after(async () => {
    await runtime.stop();
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

  describe('Transfer()', () => {
    const handler = WalletHandler.Transfer;
    const tx1 = {
      symbol: 'BTC',
      target: 'admin',
      amount: 10.001,
      description: 'the description for this transaction',
    };

    const tx2 = {
      symbol: 'GZH',
      target: ramAccount.id,
      amount: 1000,
      description: 'admin give ramAccount GZH',
    };

    it('An account can not transfer token to himself', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify(tx1)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Can not transfer token to oneself');
    });

    it('An account without enough token should response error', async () => {
      const tx = Object.assign({}, tx1, { target: account.id });
      const resp = await runtime.invoke(handler, [JSON.stringify(tx)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Do not have enough Token for this transaction');
    });

    it('Tx1 should fail because there is no enough GZH for ram cost', async () => {
      runtime.stub.setUserCtx(account.certificate);
      const resp = await runtime.invoke(handler, [JSON.stringify(tx1)]);
      runtime.stub.cleanUserCtx();
      resp.status.should.eql(500);
      resp.message.should.include('[no enough ram], Do not have enough GZH for this tx');
    });

    it('Tx2 should Success. Admin Transfer 1000 GZH to ram Account', async () => {
      const resp = await runtime.invoke(handler, [JSON.stringify(tx2)]);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.balance.should.eql(8500);
      resp.payload.gas.should.eql(500);
    });

    it('After tx2, gasAccount should have 500 GZH', async () => {
      runtime.stub.setUserCtx(gasAccount.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      runtime.stub.cleanUserCtx();
      resp.payload.wallet.GZH.amount.should.eql('500');
      resp.payload.wallet.GZH.history.length.should.eql(1);
      resp.payload.wallet.GZH.history[0].from.should.eql('admin');
      resp.payload.wallet.GZH.history[0].to.should.eql(gasAccount.id);
      resp.payload.wallet.GZH.history[0].amount.should.eql('500');
      resp.payload.wallet.GZH.history[0].description.should.include('gas for tx');
    });

    it('Before tx1, ram Account should have 1000 BTC', async () => {
      runtime.stub.setUserCtx(ramAccount.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.wallet.GZH.amount.should.eql('1000');
      runtime.stub.cleanUserCtx();
    });

    it('Before tx1, admin should have 8500 BTC', async () => {
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.wallet.GZH.amount.should.eql('8500');
    });

    it('Before tx1, user should have 20000 BTC', async () => {
      runtime.stub.setUserCtx(account.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.wallet.BTC.amount.should.eql('20000');
      runtime.stub.cleanUserCtx();
    });

    it('Tx1 should Success', async () => {
      runtime.stub.setUserCtx(account.certificate);
      const resp = await runtime.invoke(handler, [JSON.stringify(tx1)]);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.balance.should.eql(19989.49895);
      runtime.stub.cleanUserCtx();
    });

    it('After tx1, admin should have 10 BTC', async () => {
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.wallet.BTC.amount.should.eql('10.001');
      resp.payload.wallet.BTC.history.length.should.eql(1);
      resp.payload.wallet.BTC.history[0].from.should.eql(account.id);
      resp.payload.wallet.BTC.history[0].to.should.eql('admin');
      resp.payload.wallet.BTC.history[0].description.should.eql(tx1.description);
      resp.payload.wallet.BTC.history[0].amount.should.eql('10.001');
      resp.payload.wallet.BTC.history[0].balance.should.eql('10.001');
    });

    it('After tx1, user should have 19990 BTC', async () => {
      runtime.stub.setUserCtx(account.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.wallet.BTC.amount.should.eql('19989.49895');

      resp.payload.wallet.BTC.history.length.should.eql(2);
      const spend = resp.payload.wallet.BTC.history.find(t => t.type === 'spend');

      spend.amount.should.eql('10.001');
      spend.gas.should.eql('0.50005');

      runtime.stub.cleanUserCtx();
    });

    it('After tx1, ramAccount should have 0.50005 GZH', async () => {
      runtime.stub.setUserCtx(ramAccount.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      runtime.stub.cleanUserCtx();
      resp.payload.wallet.GZH.amount.should.eql('999.19992');
      resp.payload.wallet.GZH.history.length.should.eql(2);
      const ramHistory = resp.payload.wallet.GZH.history.find(t => t.type === 'spend');
      ramHistory.from.should.eql(ramAccount.id);
      ramHistory.to.should.eql(gasAccount.id);
      ramHistory.amount.should.eql('0.80008');
      ramHistory.description.should.include('ram for tx');
    });

    it('After tx1, gasAccount should have 0.50005 BTC and earn 0.80008 GZH', async () => {
      runtime.stub.setUserCtx(gasAccount.certificate);
      const resp = await runtime.invoke(GetAccount, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      runtime.stub.cleanUserCtx();
      resp.payload.wallet.BTC.amount.should.eql('0.50005');
      resp.payload.wallet.BTC.history.length.should.eql(1);
      resp.payload.wallet.BTC.history[0].from.should.eql(account.id);
      resp.payload.wallet.BTC.history[0].to.should.eql(gasAccount.id);
      resp.payload.wallet.BTC.history[0].amount.should.eql('0.50005');
      resp.payload.wallet.BTC.history[0].description.should.include('gas for tx');

      resp.payload.wallet.GZH.amount.should.eql('500.80008');
      resp.payload.wallet.GZH.history.length.should.eql(2);
      const history = resp.payload.wallet.GZH.history.find(t => t.amount === '0.80008');
      history.from.should.eql(ramAccount.id);
      history.to.should.eql(gasAccount.id);
      history.amount.should.eql('0.80008');
      history.description.should.include('[token:BTC] ram for tx ');
    });
  });
});
