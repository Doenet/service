import winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

const { createLogger, format, transports } = winston;

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.simple(),
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.simple(),
      ),
    }),
  ],
});

winston.add(logger);

if (process.env.LOGGLY_TOKEN) {
  winston.add(new Loggly({
    token: process.env.LOGGLY_TOKEN,
    subdomain: process.env.LOGGLY_SUBDOMAIN,
    tags: ['Winston-NodeJS'],
    json: true,
  }));
}

export default {
  stream: {
    write: (info) => {
      winston.log('info', info);
    },
  },
};
