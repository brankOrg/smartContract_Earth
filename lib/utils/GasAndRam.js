const math = require('mathjs');
const logger = require('./Logger').getLogger('WalletHandler');
const util = require('util');


function getDecimals(number) {
  const res = math.bignumber(number);
  return res.decimalPlaces();
}

function isInt(n) {
  return getDecimals(n) === 0;
}

function checkDecimals(amount, decimals) {
  const inputDecimals = getDecimals(amount);
  if (inputDecimals > decimals) {
    throw new Error(util.format(
      // eslint-disable-next-line max-len
      'Can not perform a token transfer with decimals larger than the token\'s max decimals. input decimals:%s, the tokens max decimals:%s',
      inputDecimals,
      decimals,
    ));
  }
}


function ceil(number, decimals) {
  logger.debug('calculate ceil() with number:%s with decimals:%s', number, decimals);
  if (typeof number !== 'number') {
    throw new Error(util.format('Expected %o to be of type float', number));
  }
  if (isInt(number)) {
    return number;
  }
  const decimalsForNumber = getDecimals(number);
  logger.debug('decimals for number is %s, decimals for this token is %s', decimalsForNumber, decimals);
  if (decimalsForNumber < decimals) {
    return number;
  }
  const res1 = math.round(math.bignumber(number), decimals);
  if (res1.gt(math.bignumber(number))) {
    return res1.toNumber();
  }
  const minNumber = math.pow(math.bignumber(0.1), math.bignumber(decimals));
  return math.add(res1, minNumber).toNumber();
}

/**
 * Calculate the gas cost for this tx
 * @param gasMin
 * @param gasPercentage
 * @param amount the amount of token to transfer
 */
function calculateGasOrRam(gasMin, gasPercentage, amount, decimals) {
  logger.debug('calculate gas for tx, gasMin=%s, gasPercentage=%s, amount=%s, decimals=%s', gasMin, gasPercentage, amount, decimals);
  checkDecimals(amount, decimals);
  let cost = math.multiply(math.bignumber(gasPercentage), math.bignumber(amount));
  if (!cost.gt(math.bignumber(gasMin))) {
    return gasMin;
  }
  // Ceil cost value that satisfy the decimals
  cost = ceil(cost.toNumber(), decimals);
  logger.debug('gas is:%s', cost);
  return cost;
}

module.exports = {
  calculateGasOrRam,
  getDecimals,
  checkDecimals,
  ceil,
};

