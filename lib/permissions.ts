import { Permission } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function hasPermission(userId: string, permission: Permission) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            roles: true,
        },
    })

    if (!user) {
        return false;
    }

    return user.roles.some((role) =>
        role.permissions.includes(permission)
    )
}

export async function listPermissions(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            roles: true,
        },
    })

    if (!user) {
        return [];
    }

    return user.roles.flatMap((role) => role.permissions);
}