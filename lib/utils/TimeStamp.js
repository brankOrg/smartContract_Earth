function getTimeStamp(stub) {
  const ts = stub.getTxTimestamp();
  let timestamp = ts.seconds.toInt();
  const nanos = ts.nanos / 1000000;
  // eslint-disable-next-line no-mixed-operators
  timestamp = timestamp * 1000 + nanos;
  return new Date(timestamp);
}

module.exports = getTimeStamp;
