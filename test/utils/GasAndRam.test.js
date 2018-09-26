const { calculateGasOrRam, ceil, getDecimals } = require('../../lib/utils/GasAndRam');
const chai = require('chai');

chai.should();


describe('Test ceil()', () => {
  const decimals = 5;

  it('non number should throw error', () => {
    try {
      ceil('123', decimals);
    } catch (e) {
      e.message.should.include('Expected \'123\' to be of type float');
    }
  });

  it('test ceil() 0', () => {
    const res = ceil(1.222225123, decimals);
    res.should.eql(1.22223);
  });

  it('test ceil() 1', () => {
    const res = ceil(0.1234587, decimals);
    res.should.eql(0.12346);
  });

  it('test ceil() 2', () => {
    const res = ceil(0.1230000123, decimals);
    res.should.eql(0.12301);
  });

  it('test ceil() 3', () => {
    const res = ceil(0.0000000001, decimals);
    res.should.eql(0.00001);
  });


  it('test int', () => {
    const res = ceil(1234, decimals);
    res.should.eql(1234);
  });

  it('test a target number with decimals less than token', () => {
    const res = ceil(0.12, decimals);
    res.should.eql(0.12);
  });
});

describe('Test gas calculate function', () => {
  const decimals = 5;

  it('should calculate gas based the transfer amount', () => {
    const res = calculateGasOrRam(0.00001, 0.001, 0.022, decimals);
    res.should.eql(0.00003);
  });

  it('should calculate gas based the transfer amount', () => {
    const res = calculateGasOrRam(0.00001, 0.0001, 123123, decimals);
    res.should.eql(12.3123);
  });

  it('should calculate gas based the transfer amount', () => {
    const res = calculateGasOrRam(0.00001, 0.0001, 1231.23, decimals);
    res.should.eql(0.12313);
  });
});

describe('Test getDecimals()', () => {
  it('test', () => {
    const res = getDecimals(123);
    console.log(res);
  });
});