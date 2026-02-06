import { env } from "./config/env";

export const config = {
    env: env.NODE_ENV ?? "development",
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as string | number,
};