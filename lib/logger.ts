import pino from "pino";

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export type Logger = typeof pinoLogger;

export function getLogger(name?: string): typeof pinoLogger {
  return name ? pinoLogger.child({ module: name }) : pinoLogger;
}

export const logger = pinoLogger;
