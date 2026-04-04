import pino from "pino";

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || "info",
});

export type Logger = typeof pinoLogger;

export function getLogger(name?: string): typeof pinoLogger {
  return name ? pinoLogger.child({ module: name }) : pinoLogger;
}

export const logger = pinoLogger;
