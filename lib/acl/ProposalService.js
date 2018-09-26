// eslint-disable-next-line
const grpc = require('grpc');
const path = require('path');
const logger = require('../utils/Logger').getLogger('ProposalService');
const { EARTH_CHAINCODE_ID } = require('../utils/Constants');

const chaincodeProto = grpc.load(path.resolve(__dirname, '../protos/chaincode.proto')).protos;

class ProposalService {
  constructor(stub) {
    this.stub = stub;
    const signedProposal = stub.getSignedProposal();
    const { proposal } = signedProposal;
    const { header } = proposal;
    const { channel_header: channelHeader } = header;
    this.channelHeader = channelHeader;
  }

  getInvoker() {
    const method = 'getInvoker';
    logger.enter(method);
    const { extension } = this.channelHeader;
    logger.debug('extension');
    console.log(extension);
    if (!extension) {
      return null;
    }
    const chaincodeId = chaincodeProto.ChaincodeID.decode(extension);
    logger.debug('chaincodeId');
    console.log(chaincodeId);

    const invoker = chaincodeId.name.split('$')[1];
    logger.debug('%s - invoker is %s, Earth chaincodeId is %s', method, invoker, EARTH_CHAINCODE_ID);
    if (invoker === EARTH_CHAINCODE_ID) {
      return null;
    }
    logger.exit(method);
    return invoker;
  }
}

module.exports = ProposalService;
