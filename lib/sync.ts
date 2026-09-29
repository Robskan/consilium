import { prisma } from "@/lib/prisma";
import {audit} from "@/lib/audit";
import {arraysEqual} from "@/lib/utils";
import {AuditTargetType, AuditTrailAction} from "@/generated/prisma/enums";

export async function syncDirectory() {
    console.info("Starting directory sync")
    const spreadsheetIds = process.env.SPREADSHEET_IDS;

    if (!spreadsheetIds) {
        throw new Error("Missing SPREADSHEET_IDS");
    }

    const ids = spreadsheetIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)

    const entries: {
        discordId: string
        positionRaw: string
    }[] = [];

    const { getSheetValues } = await import("@/lib/google-sheets");

    for (const spreadsheetId of ids) {
        const values = await getSheetValues(spreadsheetId, "rawData!A1:B");

        const newEntries = values
            .map(([positionRaw, discordId]) => ({
                positionRaw: String(positionRaw ?? "").trim(),
                discordId: String(discordId ?? "").trim(),
            }))
            .filter(({ discordId, positionRaw }) => discordId && positionRaw);

        entries.push(...newEntries)
    }

    const currentDiscordIds = new Set(
        entries.map((entry) => entry.discordId)
    );

    for (const entry of entries) {
        await prisma.directoryEntry.upsert({
            where: {
                discordId: entry.discordId,
            },
            create: entry,
            update: {
                positionRaw: entry.positionRaw,
                syncedAt: new Date(),
            },
        });
    }

    await prisma.directoryEntry.deleteMany({
        where: {
            discordId: {
                notIn: [...currentDiscordIds],
            },
        },
    });

    await syncAll()
    console.info("Finished sync directory")
    return
}

export async function syncUser(userId: string) {
    return prisma.$transaction(async (tx) => {
        // get the user
        const user = await tx.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                roles: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!user) {
            return;
        }

        // get the directory entry for the user, that is, the synced entry from the Google Sheet
        const directoryEntry = await tx.directoryEntry.findUnique({
            where: {
                discordId: user.discordID,
            },
        });

        // declare new roles as an empty array, so that if the user is not in the directory or has no matching triggers, they will have no roles -> no permissions -> be unable to access the site
        let newRoleIds: number[] = [];

        // find the roles that would apply to the user based on the triggers in the directory entry
        if (directoryEntry) {
            const roles = await tx.role.findMany({
                where: {
                    sheetsTriggers: {
                        has: directoryEntry.positionRaw,
                    },
                },
                select: {
                    id: true,
                },
            });

            newRoleIds = roles.map((role) => role.id);
        }

        // for auditing
        const oldRoleIds = user.roles.map((role) => role.id);

        // do nothing if the roles are the same
        if (arraysEqual(oldRoleIds, newRoleIds)) {
            return user;
        }

        // update the user
        const updated = await tx.user.update({
            where: {
                id: user.id,
            },
            data: {
                roles: {
                    set: newRoleIds.map((id) => ({ id })),
                },
            },
            include: {
                roles: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        // audit the audit
        await audit(tx, {
            userId: "SYSTEM",
            ip: null,
            ua: null,
            action: AuditTrailAction.USER_UPDATED,
            effects: [
                {
                    targetType: AuditTargetType.USER,
                    targetId: user.id,
                    before: {
                        roles: oldRoleIds,
                    },
                    after: {
                        roles: updated.roles.map((role) => role.id),
                    },
                },
            ],
        });

        return updated;
    });
}

export async function syncAll() {
    // gets everything and does it all in memory
    // we run a sync all function instead of running a sync on login so we can remove perms from already logged-in users. probs could do it on any permission check but its probably better this way
    console.info("Syncing all entries from the local directory")
    const [users, directoryEntries, roles] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                discordID: true,
                roles: {
                    select: {
                        id: true,
                    },
                },
            },
        }),
        prisma.directoryEntry.findMany({
            select: {
                discordId: true,
                positionRaw: true,
            },
        }),
        prisma.role.findMany({
            select: {
                id: true,
                sheetsTriggers: true,
            },
        }),
    ]);

    const directoryMap = new Map(
        directoryEntries.map((entry) => [
            entry.discordId,
            entry.positionRaw,
        ])
    );

    // puts role ids and triggers in memory for faster lookup
    const rolesByTrigger = new Map<string, number[]>();

    for (const role of roles) {
        for (const trigger of role.sheetsTriggers) {
            const roleIds = rolesByTrigger.get(trigger) ?? [];
            roleIds.push(role.id);
            rolesByTrigger.set(trigger, roleIds);
        }
    }

    let updatedCount = 0;

    // get every user and update their roles based on the directory entry and the roles that match the triggers in the directory entry
    for (const user of users) {
        // Never modify the SYSTEM user through directory sync.
        if (user.id === "SYSTEM") {
            continue;
        }

        const position = directoryMap.get(user.discordID);

        const desiredRoleIds = position
            ? rolesByTrigger.get(position) ?? []
            : [];

        const currentRoleIds = user.roles.map((role) => role.id);

        const current = new Set(currentRoleIds);
        const desired = new Set(desiredRoleIds);

        const changed =
            current.size !== desired.size ||
            [...current].some((id) => !desired.has(id));

        if (!changed) {
            continue;
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    roles: {
                        set: desiredRoleIds.map((id) => ({
                            id,
                        })),
                    },
                },
            });

            await audit(tx, {
                userId: "SYSTEM",
                ip: null,
                ua: null,
                action: AuditTrailAction.USER_UPDATED,
                metadata: {
                    source: "directory-sync",
                },
                effects: [
                    {
                        targetType: AuditTargetType.USER,
                        targetId: user.id,
                        before: {
                            roles: currentRoleIds,
                        },
                        after: {
                            roles: desiredRoleIds,
                        },
                    },
                ],
            });
        });

        updatedCount++;
    }

    console.info(
        `Finished directory sync: ${updatedCount} users updated`
    );
}