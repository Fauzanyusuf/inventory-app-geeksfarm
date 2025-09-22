import path from "path";
import fs from "fs";

const cwd = process.cwd();
export const uploadsDir = path.resolve(cwd, "uploads");
export const uploadsUrlPrefix = "/uploads";

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
