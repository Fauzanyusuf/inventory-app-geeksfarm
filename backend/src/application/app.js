import express from "express";
import errorMiddleware from "../middleware/error-middleware.js";
import apiRouter from "../route/api.js";
import publicRouter from "../route/public-api.js";

export const app = express();
app.use(express.json());

app.use(publicRouter);
app.use(apiRouter);

app.use(errorMiddleware);
