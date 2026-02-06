import { Request, Response, NextFunction } from "express";
import { HttpError } from "../utils/http-error";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json({ error: { code: err.code, message: err.message } });
  }

  return res
    .status(500)
    .json({ error: { code: "SERVER_ERROR", message: "Unexpected error" } });
};
