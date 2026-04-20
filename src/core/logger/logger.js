import pino from 'pino';

export const createLogger = (level = 'info') =>
  pino({
    level,
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,
  });
