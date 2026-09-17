import {Permission} from "@/generated/prisma/client";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/user";
import {redirect} from "next/navigation";

export async function hasPermission(userId: string, permission: Permission[]) {
    const userPermissions = await listPermissions(userId);
    return permission.some((p) =>
        userPermissions.includes(p)
    );
}

export async function hasRole(userId: string, roleIds: number[]) {
    if (roleIds.length === 0) {
        return false;
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            roles: {
                where: {
                    id: {
                        in: roleIds,
                    },
                },
                select: {
                    id: true,
                },
            },
        },
    });
    return (user?.roles.length ?? 0) > 0;
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

export async function listRoles(userId: string) {
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

    return user.roles.flatMap((role) => role.id);
}

export async function requirePermission(permission: Permission[]) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const userPermissions = await listPermissions(session.user.id);
    const hasRequiredPermission = permission.some((p) =>
        userPermissions.includes(p)
    );

    if (!hasRequiredPermission) {
        redirect("/403");
    }

    return session;
}

export async function canAccessFile(userId: string | null, fileId: number | undefined) {
    if (!fileId) {
        return false;
    }
    if (!userId) {
        const session = await getSession();
        if (!(session)) {
            return false;
        }
        userId = session.user.id;
    }

    const file = await prisma.file.findUnique({
        where: {
            id: fileId
        },
        include: {
            requiredRoles: true,
        }
    })

    // File exists?
    if (!file || file.deletedAt) {
        return false;
    }

    // User can actually read files
    if (!(await hasPermission(userId, [Permission.READ]))) {
        return false;
    }

    // If there are no required roles, then anyone with READ permission can access it
    if (file.requiredRoles.length === 0) {
        return true;
    }

    // Anyone with READ_ALL can access a file
    if (await hasPermission(userId, [Permission.READ_ALL])) {
        return true;
    }

    // Otherwise check if they have the required roles
    return await hasRole(
        userId,
        file.requiredRoles.map((role) => role.id),
    );
}