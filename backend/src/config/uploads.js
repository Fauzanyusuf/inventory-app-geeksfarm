import path from "path";
import fs from "fs";

// Ensure uploads folder is inside the backend package directory.
// If process.cwd() already points to backend, use that, otherwise join 'backend'.
const cwd = process.cwd();
const baseDir =
  path.basename(cwd) === "backend" ? cwd : path.join(cwd, "backend");
export const uploadsDir = path.join(baseDir, "uploads");
export const uploadsUrlPrefix = "/uploads";

// ensure folder exists
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

export default { uploadsDir, uploadsUrlPrefix };
