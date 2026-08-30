import { prisma } from "@/lib/prisma";

export async function syncDirectory() {
    await syncAll()
    return // TODO: make this update the directory with the google sheet
}

export async function syncUser(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    });

    if (!user) {
        return
    }

    const directoryEntry = await prisma.directoryEntry.findUnique({
        where: {
            discordId: user.discordID,
        }
    })

    if (!directoryEntry) {
        // user is not in the directory, so remove any roles from them
        await prisma.user.update({
            where: { id: user.id },
            data: {
                roles: {
                    set: [],
                }
            }
        })

        return
    }

    // find the roles that should be given to a user based on their position
    const roles = await prisma.role.findMany({
        where: {
            sheetsTriggers: {
                has: directoryEntry.positionRaw,
            }
        }
    })

    // give them the roles
    await prisma.user.update({
        where: { id: user.id },
        data: {
            roles: {
                set: roles.map(role => ({
                    id: role.id,
                })),
            }
        }
    })
}

export async function syncAll() {
    // gets everything and does it all in memory
    // we run a sync all function instead of running a sync on login so we can remove perms from already logged-in users. probs could do it on any permission check but its probably better this way
    const [users, directoryEntries, roles] = await Promise.all([
        prisma.user.findMany({
            select: {
                id: true,
                discordID: true,
            },
        }),
        prisma.directoryEntry.findMany(),
        prisma.role.findMany(),
    ]);

    const directoryMap = new Map(
        directoryEntries.map((entry) => [
            entry.discordId,
            entry,
        ])
    );

    // finds what needs to be updated and updates it
    for (const user of users) {
        const directoryEntry = directoryMap.get(user.discordID);

        if (!directoryEntry) {
            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    roles: {
                        set: [],
                    },
                },
            });

            continue;
        }

        const matchingRoles = roles.filter((role) =>
            role.sheetsTriggers.includes(directoryEntry.positionRaw)
        );

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                roles: {
                    set: matchingRoles.map((role) => ({
                        id: role.id,
                    })),
                },
            },
        });
    }
}