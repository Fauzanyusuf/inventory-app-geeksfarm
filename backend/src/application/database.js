import { PrismaClient } from "@prisma/client";
import { logger } from "./logging.js";

export const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "info", emit: "event" },
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

prisma.$on("query", (e) => {
  logger.info(`Query: ${e.query}`);
});

prisma.$on("info", (e) => {
  logger.info(`Info: ${e.message}`);
});

prisma.$on("warn", (e) => {
  logger.warn(`Warning: ${e.message}`);
});

prisma.$on("error", (e) => {
  logger.error(`Error: ${e.message}`);
});
