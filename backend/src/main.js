import { app } from "./application/app.js";
import { logger } from "./application/logging.js";
import dotenv from "dotenv";
    
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.listen(PORT, HOST, () => {
  logger.info(`Server is running on http://${HOST}:${PORT}`);
});
