"use server";

import { revalidatePath } from "next/cache";
import { syncAll, syncDirectory, syncUser } from "@/lib/sync";
import { ensureManageableUser, revokeAllUserSessions, revokeUserSession } from "@/lib/users";
import { requirePermission } from "@/lib/permissions";
import { Permission } from "@/generated/prisma/enums";

const USERS_PATH = "/dashboard/admin/manage-users";

export async function syncUserAction(formData: FormData): Promise<void> {
    const userId = formData.get("userId");

    if (typeof userId !== "string") {
        throw new Error("Invalid user");
    }

    await ensureManageableUser(userId);
    await syncUser(userId);
    revalidatePath(USERS_PATH);
}

export async function syncAllUsersAction(): Promise<void> {
    await requirePermission([Permission.ADMINISTRATOR]);
    await syncAll();
    revalidatePath(USERS_PATH);
}

export async function refreshDirectoryAction(): Promise<void> {
    await requirePermission([Permission.ADMINISTRATOR]);
    await syncDirectory();
    revalidatePath(USERS_PATH);
}

export async function revokeUserSessionAction(formData: FormData): Promise<void> {
    const userId = formData.get("userId");
    const sessionId = formData.get("sessionId");

    if (typeof userId !== "string" || typeof sessionId !== "string") {
        throw new Error("Invalid session");
    }

    await revokeUserSession(userId, sessionId);
    revalidatePath(USERS_PATH);
}

export async function revokeAllUserSessionsAction(formData: FormData): Promise<void> {
    const userId = formData.get("userId");

    if (typeof userId !== "string") {
        throw new Error("Invalid user");
    }

    await revokeAllUserSessions(userId);
    revalidatePath(USERS_PATH);
}
