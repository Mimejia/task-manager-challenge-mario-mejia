import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default("7d"),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31).default(10),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    const formatted = parsed.error.issues
        .map((issue) => {
            const path = issue.path.join(".") || "(root)";
            return `${path}: ${issue.message}`;
        })
        .join("\n");

    throw new Error(`Invalid environment variables:\n${formatted}`);
}

export const env = parsed.data;