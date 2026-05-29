import pino from 'pino';

export const logger = pino({
  browser: {
    asObject: false,
    serialize: false,
  },
  level: 'warn',
  name: 'radioflow',
});
