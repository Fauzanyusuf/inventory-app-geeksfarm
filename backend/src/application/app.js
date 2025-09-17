import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import publicRouter from "../route/public-api.js";
import apiRouter from "../route/api.js";
import errorMiddleware from "../middleware/error-middleware.js";
import bigintSerializer from "../middleware/bigint-serializer.js";
import path from "path";

export const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bigintSerializer);

// serve uploads statically
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

app.use(publicRouter);
app.use(apiRouter);

app.use(errorMiddleware);
