import winston from "winston";

const { combine, printf, colorize } = winston.format;

const humanFormat = combine(
  colorize({ all: true }),
  printf(({ level, message }) => `[${level}]: ${message}`)
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: humanFormat,
  transports: [new winston.transports.Console()],
});
