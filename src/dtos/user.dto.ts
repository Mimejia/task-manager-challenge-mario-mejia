import { users } from "@prisma/client";

export const toUserDTO = (user: users) => ({
  id: Number(user.id),
  email: user.email,
  fullName: user.full_name,
  isActive: user.is_active,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});
