const ACCOUNT_PREFIX = 'earth.user';
const TOKEN_PREFIX = 'earth.token';
const TX_PREFIX = 'earth.tx';
const CONTRACT_PREFIX = 'earth.contract';

const EARTH_ACCOUNT_TYPE_ADMIN = 'admin';
const EARTH_ACCOUNT_TYPE_USER = 'user';
const EARTH_ACCOUNT_TYPE_CONTRACT = 'contract';

const USER_ROLES = ['admin', 'user', 'contract'];

const BASE_TOKEN = {
  name: 'GZH',
  symbol: 'GZH',
};

const EARTH_MODEL_TOKEN = 'Earth.Token';
const EARTH_MODEL_ACCOUNT = 'Earth.Account';
const EARTH_MODEL_WALLET = 'Earth.Wallet';
const EARTH_MODEL_TX = 'Earth.TX';
const EARTH_CHAINCODE_ID = 'e24ea80d-d703-47a3-88af-1c69f21b025d';


const TX_TYPE_EARN = 'earn';
const TX_TYPE_SPEND = 'spend';
const TX_TYPE_MINTAGE = 'mintage';


module.exports = {
  ACCOUNT_PREFIX,
  TOKEN_PREFIX,
  TX_PREFIX,
  CONTRACT_PREFIX,

  USER_ROLES,

  BASE_TOKEN,
  EARTH_CHAINCODE_ID,

  EARTH_ACCOUNT_TYPE_ADMIN,
  EARTH_ACCOUNT_TYPE_USER,
  EARTH_ACCOUNT_TYPE_CONTRACT,

  EARTH_MODEL_TOKEN,
  EARTH_MODEL_ACCOUNT,
  EARTH_MODEL_WALLET,
  EARTH_MODEL_TX,

  TX_TYPE_EARN,
  TX_TYPE_SPEND,
  TX_TYPE_MINTAGE,
};
