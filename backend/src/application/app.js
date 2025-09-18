import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import publicRouter from "../route/public-api.js";
import apiRouter from "../route/api.js";
import errorMiddleware from "../middleware/error-middleware.js";
import bigintSerializer from "../middleware/bigint-serializer.js";
import path from "path";
import { uploadsDir } from "../config/uploads.js";

export const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bigintSerializer);

// serve uploads statically (use centralized uploads dir inside backend)
app.use("/uploads", express.static(uploadsDir));

app.use(publicRouter);
app.use(apiRouter);

app.use(errorMiddleware);
