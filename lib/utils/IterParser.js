/* eslint-disable no-await-in-loop */
const logger = require('./Logger').getLogger('IterParser');

async function getAllResults(iterator) {
  const method = 'getAllResults';
  logger.enter(method);
  const allResults = [];
  let done = false;
  while (done === false) {
    const res = await iterator.next();
    if (res.value && res.value.value) {
      const val = res.value.value.toString('utf8');
      logger.debug(`Get response from shim ${val}`);
      allResults.push(JSON.parse(val));
    }
    if (res.done) {
      done = true;
      logger.debug('Get all results from shim');
      await iterator.close();
    }
  }
  logger.debug('all results: %j', allResults);
  return allResults;
}

module.exports = getAllResults;
