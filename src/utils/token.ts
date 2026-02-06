import * as jwt from "jsonwebtoken";
import { config } from "../config";

export const signAccessToken = (payload: { userId: number }) => {
  if (!config.jwtAccessSecret) {
    throw new Error("JWT_ACCESS_SECRET is missing");
  }

  const secret: jwt.Secret = config.jwtAccessSecret;
  const expiresIn =
    config.jwtAccessExpiresIn as Exclude<
      jwt.SignOptions["expiresIn"],
      undefined
    >;
  const options: jwt.SignOptions = { expiresIn };

  return jwt.sign(payload, secret, options);
};