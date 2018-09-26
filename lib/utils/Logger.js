const winston = require('winston');

const loggers = {};

function createLogger(level, name) {
  // a singleton and default logger
  const {
    config,
  } = winston;
  const levels = {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  };

  const logger = new winston.Logger({
    level,
    levels,
    transports: [
      new winston.transports.Console({
        timestamp: () => new Date().toISOString(),
        handleExceptions: true,
        formatter: options => `${options.timestamp()} ${
          config.colorize(options.level, options.level.toUpperCase())} ${
          name ? config.colorize(options.level, `[${name}]`) : ''
        } ${options.message ? options.message : ''} ${
          options.meta && Object.keys(options.meta).length ? `\n\t${JSON.stringify(options.meta)}` : ''}`,
      }),
    ],
    exitOnError: false,
  });
  return logger;
}


function getLogger(name = '') {
  // set the logging level based on the environment variable
  // configured by the peer
  const level = process.env.EARTH_LOGGING_LEVEL;
  let loglevel = 'debug';
  if (typeof level === 'string') {
    switch (level.toUpperCase()) {
      case 'NONE':
        loglevel = 'none';
        break;
      case 'ERROR':
        loglevel = 'error';
        break;
      case 'WARNING':
        loglevel = 'warn';
        break;
      case 'INFO':
        loglevel = 'info';
        break;
      case 'DEBUG':
        loglevel = 'debug';
        break;
      default:
        loglevel = 'debug';
    }
  }

  let logger;
  if (loggers[name]) {
    logger = loggers[name];
    logger.level = loglevel;
  } else {
    logger = createLogger(loglevel, name);
    loggers[name] = logger;
  }

  logger.enter = (method) => {
    logger.debug('%s - Enter', method);
  };

  logger.exit = (method) => {
    logger.debug('%s - Exit', method);
  };

  return logger;
}

module.exports.getLogger = getLogger;
