import { app } from "./application/app.js";
import { logger } from "./application/logging.js";
import "dotenv/config";

app.listen(3000, () => {
  logger.info(
    `Server is running on http://${process.env.HOST}:${process.env.PORT}`
  );
});
