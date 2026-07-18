import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './env';

const level = env.NODE_ENV === 'development' ? 'debug' : 'info';

const logger = pino({
  level,
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }),
});

const httpLogger = pinoHttp({
  logger,
  genReqId: () => crypto.randomUUID(),
});

export { logger, httpLogger };
