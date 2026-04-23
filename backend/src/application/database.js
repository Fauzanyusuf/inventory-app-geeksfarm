import { PrismaClient } from "@prisma/client";
import { logger } from "./logging.js";

export const prisma = new PrismaClient({
  log: [
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

prisma.$on("warn", (e) => {
  logger.warn(`Warning: ${e.message}`);
});

prisma.$on("error", (e) => {
  logger.error(`Error: ${e.message}`);
});
