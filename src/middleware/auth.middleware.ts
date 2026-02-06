import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  user?: { userId: number };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  }

  const token = header.replace("Bearer ", "");
  if (!config.jwtAccessSecret) {
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "JWT secret not configured" } });
  }

  try {
    const secret: jwt.Secret = config.jwtAccessSecret;
    const payload = jwt.verify(token, secret) as { userId: number };
    req.user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
  }
};