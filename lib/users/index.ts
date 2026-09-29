import "server-only";

import { Permission } from "@/generated/prisma/enums";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type ManagedUserSession = {
    id: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
};

export type ManagedUser = {
    id: string;
    name: string;
    username: string;
    discordID: string;
    image: string | null;
    roles: {
        id: number;
        name: string;
    }[];
    sessions: ManagedUserSession[];
    directoryEntry: {
        positionRaw: string;
        syncedAt: Date;
    } | null;
};

/**
 * Returns the users that have authenticated with Discord and their current
 * directory-derived access. User identity and roles are intentionally not
 * editable here: Discord and the directory remain their respective sources
 * of truth. Session metadata is included for the administrator UI; bearer
 * tokens are deliberately excluded from the query.
 */
export async function listManagedUsers(): Promise<ManagedUser[]> {
    await requirePermission([Permission.ADMINISTRATOR]);

    const [users, directoryEntries] = await Promise.all([
        prisma.user.findMany({
            where: {
                id: {
                    not: "SYSTEM",
                },
            },
            select: {
                id: true,
                name: true,
                username: true,
                discordID: true,
                image: true,
                roles: {
                    select: {
                        id: true,
                        name: true,
                    },
                    orderBy: {
                        name: "asc",
                    },
                },
                sessions: {
                    select: {
                        id: true,
                        expiresAt: true,
                        createdAt: true,
                        updatedAt: true,
                        ipAddress: true,
                        userAgent: true,
                    },
                    orderBy: {updatedAt: "desc"},
                },
            },
            orderBy: {
                name: "asc",
            },
        }),
        prisma.directoryEntry.findMany({
            select: {
                discordId: true,
                positionRaw: true,
                syncedAt: true,
            },
        }),
    ]);

    const directoryByDiscordId = new Map(
        directoryEntries.map((entry) => [entry.discordId, entry]),
    );

    return users.map((user) => ({
        ...user,
        directoryEntry: directoryByDiscordId.get(user.discordID) ?? null,
    }));
}

export async function ensureManageableUser(userId: string): Promise<void> {
    await requirePermission([Permission.ADMINISTRATOR]);

    if (!userId || userId === "SYSTEM") {
        throw new Error("Invalid user");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!user) {
        throw new Error("User not found");
    }
}

/**
 * Invalidates one of a user's sessions. The user ID is included in the query
 * so a session belonging to another user can never be revoked accidentally.
 */
export async function revokeUserSession(
    userId: string,
    sessionId: string,
): Promise<void> {
    await ensureManageableUser(userId);

    if (!sessionId) {
        throw new Error("Invalid session");
    }

    const { count } = await prisma.session.deleteMany({
        where: {
            id: sessionId,
            userId,
        },
    });

    if (count === 0) {
        throw new Error("Session not found");
    }
}

/** Invalidates every persisted session for a user. */
export async function revokeAllUserSessions(userId: string): Promise<number> {
    await ensureManageableUser(userId);

    const { count } = await prisma.session.deleteMany({
        where: { userId },
    });

    return count;
}
