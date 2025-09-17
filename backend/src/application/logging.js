import winston from "winston";
const { combine, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: "silly",
  format: combine(colorize(), simple()),
  transports: [new winston.transports.Console({})],
});
