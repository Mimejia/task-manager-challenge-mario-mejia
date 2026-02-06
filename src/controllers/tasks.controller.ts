import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { toTaskDTO } from "../dtos/task.dto";
import { HttpError } from "../utils/http-error";
import {
    createUserTask,
    deleteUserTask,
    listUserTasks,
    updateUserTask,
    CreateUserTaskInput,
    UpdateUserTaskInput,
} from "../services/tasks.service";
import { tasks_status } from "@prisma/client";

const parseOptionalBigInt = (value: unknown) => {
    if (typeof value === "string" && value.trim() !== "") return BigInt(value);
    if (typeof value === "number" && Number.isFinite(value)) return BigInt(value);
    return null;
};

const isValidStatus = (value: unknown): value is tasks_status =>
    value === "pendiente" || value === "en_progreso" || value === "completada";

const parseParamBigInt = (value: unknown) => {
    const v = Array.isArray(value) ? value[0] : value;
    if (typeof v === "string" && v.trim() !== "") return BigInt(v);
    return null;
};

export const listTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const tasks = await listUserTasks(userId);
        return res.json({ data: tasks.map(toTaskDTO) });
    } catch (error) {
        return next(error);
    }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const body = req.body as Record<string, unknown>;

        const title = body["title"];
        if (typeof title !== "string" || title.trim().length === 0) {
            throw new HttpError(400, "BAD_REQUEST", "Title is required");
        }

        const workspaceId = parseOptionalBigInt(body["workspaceId"]);
        const clientRev = parseOptionalBigInt(body["clientRev"]);

        const input: CreateUserTaskInput = {
            userId,
            title: title.trim(),
            workspaceId,
        };

        if (typeof body["description"] === "string") input.description = body["description"];
        if (isValidStatus(body["status"])) input.status = body["status"];
        if (typeof body["clientId"] === "string") input.clientId = body["clientId"];
        if (clientRev !== null) input.clientRev = clientRev;
        if (typeof body["deviceId"] === "string") input.deviceId = body["deviceId"];

        const task = await createUserTask(input);
        return res.status(201).json({ data: toTaskDTO(task) });
    } catch (error) {
        return next(error);
    }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const taskId = parseParamBigInt(req.params.id);
        if (taskId === null) throw new HttpError(400, "BAD_REQUEST", "Task id is required");

        const body = req.body as Record<string, unknown>;

        const input: UpdateUserTaskInput = { userId, taskId };

        if (typeof body["title"] === "string") input.title = body["title"];
        if (typeof body["description"] === "string") input.description = body["description"];
        if (isValidStatus(body["status"])) input.status = body["status"];

        const baseVersion = parseOptionalBigInt(body["baseVersion"]);
        if (baseVersion !== null) input.baseVersion = baseVersion;

        if (typeof body["deviceId"] === "string") input.deviceId = body["deviceId"];

        const task = await updateUserTask(input);
        return res.status(200).json({ data: toTaskDTO(task) });
    } catch (error) {
        return next(error);
    }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = BigInt(req.user!.userId);
        const taskId = parseParamBigInt(req.params.id);
        if (taskId === null) throw new HttpError(400, "BAD_REQUEST", "Task id is required");

        const body = req.body as Record<string, unknown>;
        const deviceId = typeof body["deviceId"] === "string" ? body["deviceId"] : undefined;

        await deleteUserTask({ userId, taskId, deviceId });
        return res.status(204).send();
    } catch (error) {
        return next(error);
    }
};