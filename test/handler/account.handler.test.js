const AccountHandler = require('../../lib/handler/AccountHandler');
const Runtime = require('../pouchdb-runtime/runtime-pouchdb');
const chai = require('chai');
const chaiPromised = require('chai-as-promised');

chai.use(chaiPromised);
chai.should();

describe('Test Account', () => {
  let runtime;
  const user = {
    id: '9ec73604-0225-4d99-83d7-b858b499e639',
    name: 'zhangsan',
    role: 'user',
  };

  const cert = '-----BEGIN CERTIFICATE-----\n' +
    'MIICwDCCAmagAwIBAgIUMdfKxK9vzQMDyfn6wtOJunKqtMMwCgYIKoZIzj0EAwIw\n' +
    'czELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNh\n' +
    'biBGcmFuY2lzY28xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMT\n' +
    'E2NhLm9yZzEuZXhhbXBsZS5jb20wHhcNMTgwNjE3MDM1MjAwWhcNMTkwNjE3MDM1\n' +
    'NzAwWjBaMSkwDQYDVQQLEwZjbGllbnQwCwYDVQQLEwRvcmcxMAsGA1UECxMEdXNl\n' +
    'cjEtMCsGA1UEAxMkOWVjNzM2MDQtMDIyNS00ZDk5LTgzZDctYjg1OGI0OTllNjM5\n' +
    'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEE+t8qJ2Qjy77iFUl2gE1OSuZ9QOI\n' +
    'AserxOui7FEeeqTJarokt0fDxEeIbdbFQdZbhN8AVHwrtNi4MPuHlRrRCaOB8DCB\n' +
    '7TAOBgNVHQ8BAf8EBAMCB4AwDAYDVR0TAQH/BAIwADAdBgNVHQ4EFgQU9BGghcE0\n' +
    'm2PTpmT9MYDr2BL1jLAwKwYDVR0jBCQwIoAgllQHfJm2YorpFTfWi4KWa0D2MgN5\n' +
    'y8FPH9iCpNq8lZQwgYAGCCoDBAUGBwgBBHR7ImF0dHJzIjp7ImhmLkFmZmlsaWF0\n' +
    'aW9uIjoib3JnMS51c2VyIiwiaGYuRW5yb2xsbWVudElEIjoiOWVjNzM2MDQtMDIy\n' +
    'NS00ZDk5LTgzZDctYjg1OGI0OTllNjM5IiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAK\n' +
    'BggqhkjOPQQDAgNIADBFAiEAwGbq0Z7wqTQm/vG2TU4y1IniWHhoitqLzW81+IOH\n' +
    'd+ACIACp77nySZ2j8JrY5MEDXrTd3ua+hOdAoAwARDp6e2ug\n' +
    '-----END CERTIFICATE-----\n';

  before(() => {
    runtime = new Runtime();
  });

  after(async () => {
    await runtime.stop();
  });

  describe('InitAdmin()', () => {
    const handler = AccountHandler.InitAdmin;

    it('init admin should success', async () => {
      const resp = await runtime.invoke(handler);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.id.should.equal('admin');
      resp.payload.name.should.equal('Earth BlockChain Bootstrap User');
      resp.payload.role.should.equal('admin');
    });
  });

  describe('Create()', () => {
    const handler = AccountHandler.Create;
    let req;

    it('missing params should response error', async () => {
      const resp = await runtime.invoke(handler);
      resp.status.should.eql(500);
      resp.message.should.eql('Create new Account requires params');
    });

    it('wrong params length should response error', async () => {
      const resp = await runtime.invoke(handler, ['123', 'zhangsan']);
      resp.status.should.eql(500);
      resp.message.should.eql('Create new Account requires params of length 1');
    });

    it('dummy identity do not have permission to create a user', async () => {
      req = {
        id: '123',
        name: 'zhangsan',
      };
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Identity admin do not have permission to create new User 123');
    });

    it('create an account with a id that already exists should throw error', async () => {
      req = {
        id: 'admin',
        name: 'zhangsan',
      };
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(500);
      resp.message.should.eql('Account with id admin already exists');
    });

    it('success', async () => {
      runtime.stub.setUserCtx(cert);
      req = {
        id: user.id,
        name: user.name,
      };
      const resp = await runtime.invoke(handler, [JSON.stringify(req)]);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.id.should.equal(user.id);
      resp.payload.name.should.equal(user.name);
      resp.payload.role.should.equal('user');
      runtime.stub.cleanUserCtx();
    });
  });

  describe('GetAccountInfo() can retrieve the basic info of an account', () => {
    const handler = AccountHandler.GetAccountInfo;

    it('getAccountInfo should success', async () => {
      const resp = await runtime.invoke(handler, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.id.should.equal('admin');
      resp.payload.name.should.equal('Earth BlockChain Bootstrap User');
      resp.payload.role.should.equal('admin');
    });
  });

  describe('GetAccount() can retrieve the detail info of an account', () => {
    it('', () => {

    });
  });

  describe('Admin Account can update another account to admin', () => {
    const handler = AccountHandler.UpdateAccount;
    let resp;

    it('Success update account', async () => {
      resp = await runtime.invoke(handler, [user.id]);
      resp.status.should.eql(200);

      const { GetAccountInfo } = AccountHandler;
      runtime.stub.setUserCtx(cert);
      resp = await runtime.invoke(GetAccountInfo, []);
      resp.status.should.eql(200);
      resp.payload = JSON.parse(resp.payload);
      resp.payload.role.should.eql('admin');
      runtime.stub.cleanUserCtx();
    });
  });
});
