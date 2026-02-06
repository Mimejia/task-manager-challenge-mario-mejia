import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken } from "../utils/token";
import { HttpError } from "../utils/http-error";
import {
    assignRoleToUser,
    createLocalUser,
    ensureRole,
    findUserByEmail,
} from "../repositories/user.repository";
import {
    createDefaultWorkspace,
} from "../repositories/workspace.repository";

export const registerUser = async (input: {
    email: string;
    fullName: string;
    password: string;
}) => {
    const existing = await findUserByEmail(input.email);
    if (existing) {
        throw new HttpError(409, "EMAIL_TAKEN", "Email already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await createLocalUser({
        email: input.email,
        fullName: input.fullName,
        passwordHash,
    });

    const role = await ensureRole("user", "Usuario");
    await assignRoleToUser(user.id, role.id);

    await createDefaultWorkspace(user.id);

    return { user };
};

export const loginUser = async (input: {
    email: string;
    password: string;
}) => {
    const user = await findUserByEmail(input.email);
    if (!user || !user.password_hash) {
        throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const ok = await verifyPassword(input.password, user.password_hash);
    if (!ok) {
        throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    const accessToken = signAccessToken({ userId: Number(user.id) });

    return { user, accessToken };
};
