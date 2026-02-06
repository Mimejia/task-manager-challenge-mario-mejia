import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { listTasks, createTask, updateTask, deleteTask } from "../controllers/tasks.controller";

const router = Router();

router.get("/", authMiddleware, listTasks);

router.post(
    "/",
    authMiddleware,
    [
        body("title").isString().isLength({ min: 1 }),
        body("status").optional().isIn(["pendiente", "en_progreso", "completada"]),
        body("workspaceId").optional().isInt(),
        body("clientId").optional().isString(),
        body("clientRev").optional().isInt(),
        body("deviceId").optional().isString(),
        validateRequest,
    ],
    createTask
);

router.patch(
    "/:id",
    authMiddleware,
    [
        body("title").optional().isString(),
        body("description").optional().isString(),
        body("status").optional().isIn(["pendiente", "en_progreso", "completada"]),
        body("baseVersion").optional().isInt(),
        body("deviceId").optional().isString(),
        validateRequest,
    ],
    updateTask
);

router.delete(
    "/:id",
    authMiddleware,
    [body("deviceId").optional().isString(), validateRequest],
    deleteTask
);

export default router;