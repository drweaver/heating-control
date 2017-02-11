var winston = require('winston');

module.exports = (label) => {
  return new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            prettyPrint: true,
            timestamp: true,
            label: label
        })
    ]
  });
};