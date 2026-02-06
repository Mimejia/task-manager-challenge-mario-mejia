import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import tasksRoutes from "./routes/tasks.routes";
import syncRoutes from "./routes/sync.routes";
import workspacesRoutes from "./routes/workspaces.routes";
import { errorMiddleware } from "./middleware/error.middleware";

export const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", authRoutes);
app.use("/api/workspaces", workspacesRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/sync", syncRoutes);

app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }));
app.use(errorMiddleware);