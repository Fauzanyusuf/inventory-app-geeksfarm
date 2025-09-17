import express from "express";
import publicRouter from "../route/public-api.js";
import apiRouter from "../route/api.js";
import errorMiddleware from "../middleware/error-middleware.js";
import cookieParser from "cookie-parser";

export const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(publicRouter);
app.use(apiRouter);

app.use(errorMiddleware);
