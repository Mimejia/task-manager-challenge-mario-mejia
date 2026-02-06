import { Router } from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();

router.post(
  "/register",
  [
    body("email").isEmail(),
    body("fullName").isString().isLength({ min: 2 }),
    body("password").isString().isLength({ min: 6 }),
    validateRequest,
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").isString(), validateRequest],
  login
);

// TODO: Google OAuth (pendiente por tiempo)
// router.post(
//   "/google",
//   [body("idToken").isString(), validateRequest],
//   googleLogin
// );

// TODO: Email verification (pendiente por tiempo)
// router.post(
//   "/verify-email",
//   [body("token").isString(), validateRequest],
//   verifyEmail
// );

export default router;