import { app } from "./application/app.js";
import { logger } from "./application/logging.js";
import "dotenv/config";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

app.listen(PORT, () => {
  logger.info(`Server is running on http://${HOST}:${PORT}`);
});
