import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { syncOperations } from "../controllers/sync.controller";

const router = Router();

router.post(
    "/operations",
    authMiddleware,
    [
        body("deviceId").isString(),
        body("operations").isArray({ min: 1 }),
        validateRequest,
    ],
    syncOperations
);

export default router;