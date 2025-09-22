import winston from "winston";
const { combine, colorize, simple } = winston.format;

export const logger = winston.createLogger({
  level: "warn",
  format: combine(colorize(), simple()),
  transports: [new winston.transports.Console({})],
});

export function winstonMorgan(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration} ms`;
    logger.info(logMessage);
  });

  next();
}

export default {
  logger,
  winstonMorgan,
};
