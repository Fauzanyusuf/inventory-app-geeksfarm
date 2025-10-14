import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "../route/index.js";
import errorMiddleware from "../middleware/error-middleware.js";
import { uploadsDir } from "../config/uploads.js";
import { winstonMorgan } from "./logging.js";

export const app = express();
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"https://frontend-inventory-app-fauzan-yusufs-projects.vercel.app/",
		],
		credentials: true,
		optionsSuccessStatus: 200,
	})
);
app.use(express.json());
app.use(cookieParser());
app.use(winstonMorgan);

app.use("/uploads", express.static(uploadsDir));

app.use("/api", routes);

app.use(errorMiddleware);
