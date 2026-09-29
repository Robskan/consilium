import "server-only";

import {Permission} from "@/generated/prisma/client";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/user";
import {redirect} from "next/navigation";

export async function getUserAccess(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            roles: {
                select: {
                    id: true,
                    permissions: true,
                },
            },
        },
    });

    if (!user) {
        return {roleIds: [], permissions: [] as Permission[]};
    }

    return {
        roleIds: user.roles.map((role) => role.id),
        permissions: user.roles.flatMap((role) => role.permissions),
    };
}

export async function requirePermission(permission: Permission[]) {
    return (await requirePermissionWithAccess(permission)).session;
}

export async function requirePermissionWithAccess(permission: Permission[]) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const access = await getUserAccess(session.user.id);
    const hasRequiredPermission = permission.some((p) =>
        access.permissions.includes(p)
    );

    if (!hasRequiredPermission) {
        redirect("/403");
    }

    return {session, access};
}

export async function canAccessFileByAccess(
    access: Awaited<ReturnType<typeof getUserAccess>>,
    fileId: number,
    allowDeleted = false,
) {
    if (!Number.isInteger(fileId) || fileId < 1) return false;
    const file = await prisma.file.findUnique({
        where: {id: fileId},
        select: {
            deletedAt: true,
            requiredRoles: {select: {id: true}},
        },
    });
    return canAccessFileWithAccess(access, file, allowDeleted);
}

export function canAccessFileWithAccess(
    access: Awaited<ReturnType<typeof getUserAccess>>,
    file: {
        deletedAt: Date | null;
        requiredRoles: {id: number}[];
    } | null,
    allowDeleted = false,
) {
    if (!file) {
        return false;
    }

    if (file.deletedAt && !allowDeleted) return false;

    // If there are no required roles, then anyone with READ permission can access it
    if (file.requiredRoles.length === 0) {
        return true;
    }

    return access.permissions.includes(Permission.READ_ALL) ||
        file.requiredRoles.some((role) => access.roleIds.includes(role.id));
}
