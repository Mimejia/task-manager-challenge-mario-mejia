import { workspaces } from "@prisma/client";

export const toWorkspaceDTO = (workspace: workspaces) => ({
    id: Number(workspace.id),
    name: workspace.name,
    owner_user_id: Number(workspace.owner_user_id),
    is_archived: workspace.is_archived,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
});
