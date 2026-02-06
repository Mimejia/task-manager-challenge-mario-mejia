import { Router } from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import {
    acceptWorkspaceInvitation,
    createWorkspace,
    inviteToWorkspace,
    listWorkspaces,
} from "../controllers/workspaces.controller";

const router = Router();

router.get("/", authMiddleware, listWorkspaces);

router.post(
    "/",
    authMiddleware,
    [body("name").isString().isLength({ min: 1 }), validateRequest],
    createWorkspace
);

router.post(
    "/:id/invitations",
    authMiddleware,
    [
        body("email").optional().isEmail(),
        body("canView").optional().isBoolean(),
        body("canCreate").optional().isBoolean(),
        body("canEdit").optional().isBoolean(),
        body("canDelete").optional().isBoolean(),
        body("expiresInHours").optional().isInt({ min: 1, max: 168 }),
        validateRequest,
    ],
    inviteToWorkspace
);

router.post(
    "/invitations/accept",
    authMiddleware,
    [body("token").isString(), validateRequest],
    acceptWorkspaceInvitation
);

export default router;
