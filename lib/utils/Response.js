const shim = require('fabric-shim');
const TypeChecker = require('./TypeChecker');

function Response(success, msgOrPayload) {
  let res;
  if (TypeChecker.checkString(msgOrPayload)) {
    res = msgOrPayload;
  } else {
    res = JSON.stringify(msgOrPayload);
  }
  if (success) {
    return shim.success(Buffer.from(res));
  }
  return shim.error(Buffer.from(res));
}

module.exports = Response;
