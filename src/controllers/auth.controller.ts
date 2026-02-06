import { Request, Response, NextFunction } from "express";
import { toUserDTO } from "../dtos/user.dto";
import { loginUser, registerUser } from "../services/auth.service";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, fullName, password } = req.body;
        const { user } = await registerUser({ email, fullName, password });

        return res.status(201).json({
            data: {
                user: toUserDTO(user),
            },
        });
    } catch (error) {
        return next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken } = await loginUser({ email, password });

        return res.json({
            data: {
                user: toUserDTO(user),
                accessToken,
            },
        });
    } catch (error) {
        return next(error);
    }
};

// TODO: Google OAuth (pendiente por tiempo)
// export const googleLogin = async (_req: Request, res: Response) => {
//     return res.status(501).json({
//         error: { code: "NOT_IMPLEMENTED", message: "Google auth pendiente por tiempo" },
//     });
// };

// TODO: Email verification (pendiente por tiempo)
// export const verifyEmail = async (_req: Request, res: Response) => {
//     return res.status(501).json({
//         error: { code: "NOT_IMPLEMENTED", message: "Verificación por correo pendiente" },
//     });
// };