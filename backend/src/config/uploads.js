import path from "path";
import fs from "fs/promises";

const cwd = process.cwd();

export const uploadsDir = path.join(cwd, "uploads");
export const uploadsUrlPrefix = "/uploads";
export const uploadsBaseUrl = process.env.APP_BASE_URL;
await fs.mkdir(uploadsDir, { recursive: true });
