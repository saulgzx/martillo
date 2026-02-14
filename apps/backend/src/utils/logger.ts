import winston from 'winston';
import { env } from '../config/env';

const isProd = env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: isProd ? 'warn' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: !isProd }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: isProd
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});
