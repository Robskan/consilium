import "server-only";

import {AuditTargetType, AuditTrailAction, Permission} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {requirePermission, requirePermissionWithAccess} from "@/lib/permissions";
import { audit } from "@/lib/audit";

interface CreateRoleInput {
    name: string;
    permissions: Permission[];
    sheetsTriggers: string[];
}

interface UpdateRoleInput {
    id: number;
    name?: string;
    permissions?: Permission[];
    sheetsTriggers?: string[];
}

export async function getRoleManagementData() {
    const {access} = await requirePermissionWithAccess([Permission.ADMINISTRATOR]);
    const roles = await prisma.role.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        files: true,
                    },
                },
            },
            orderBy: {name: "asc"},
        });

    return {roles, actorPermissions: access.permissions};
}

export async function createRole(input: CreateRoleInput) {
    const {session, access} = await requirePermissionWithAccess([Permission.ADMINISTRATOR]);
    const name = input.name.trim();
    const permissions = [...new Set(input.permissions)];
    const sheetsTriggers = [...new Set(input.sheetsTriggers.map((value) => value.trim()).filter(Boolean))];
    const actorPermissions = access.permissions;

    if (!name) {
        throw new Error("Role name is required");
    }

    if (permissions.some((permission) => !actorPermissions.includes(permission))) {
        throw new Error("Cannot grant a permission you do not have");
    }

    return prisma.$transaction(async (tx) => {
        const created = await tx.role.create({
            data: {
                name,
                permissions,
                sheetsTriggers,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.ROLE_CREATED,
            effects: [
                {
                    targetType: AuditTargetType.ROLE,
                    targetId: String(created.id),
                    after: {
                        name: created.name,
                        permissions: created.permissions,
                        sheetsTriggers: created.sheetsTriggers,
                    },
                },
            ],
        });

        return created;
    });
}

export async function updateRole(input: UpdateRoleInput) {
    const {session, access} = await requirePermissionWithAccess([Permission.ADMINISTRATOR]);
    const name = input.name?.trim();
    const permissions = input.permissions ? [...new Set(input.permissions)] : undefined;
    const sheetsTriggers = input.sheetsTriggers
        ? [...new Set(input.sheetsTriggers.map((value) => value.trim()).filter(Boolean))]
        : undefined;
    const actorPermissions = access.permissions;

    if (input.name !== undefined && !name) {
        throw new Error("Role name is required");
    }

    return prisma.$transaction(async (tx) => {
        const before = await tx.role.findUnique({
            where: {
                id: input.id,
            },
        });

        if (!before) {
            throw new Error("Role not found");
        }

        const newlyGrantedPermissions = permissions?.filter(
            (permission) => !before.permissions.includes(permission),
        ) ?? [];
        if (newlyGrantedPermissions.some((permission) => !actorPermissions.includes(permission))) {
            throw new Error("Cannot grant a permission you do not have");
        }

        const updated = await tx.role.update({
            where: {
                id: input.id,
            },
            data: {
                name,
                permissions,
                sheetsTriggers,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.ROLE_UPDATED,
            effects: [
                {
                    targetType: AuditTargetType.ROLE,
                    targetId: String(updated.id),
                    before: {
                        name: before.name,
                        permissions: before.permissions,
                        sheetsTriggers: before.sheetsTriggers,
                    },
                    after: {
                        name: updated.name,
                        permissions: updated.permissions,
                        sheetsTriggers: updated.sheetsTriggers,
                    },
                },
            ],
        });

        return updated;
    });
}

export async function deleteRole(id: number) {
    const session = await requirePermission([Permission.ADMINISTRATOR]);

    return prisma.$transaction(async (tx) => {
        const role = await tx.role.findUnique({
            where: {
                id,
            },
            include: {
                users: {
                    select: {
                        id: true,
                    },
                },
                files: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        if (!role) {
            throw new Error("Role not found");
        }

        if (role.users.length > 0) {
            throw new Error("Cannot delete a role that is assigned to users");
        }

        if (role.files.length > 0) {
            throw new Error("Cannot delete a role that is required by files");
        }

        const deleted = await tx.role.delete({
            where: {
                id,
            },
        });

        await audit(tx, {
            userId: session.user.id,
            ip: session.session.ipAddress ?? null,
            ua: session.session.userAgent ?? null,
            action: AuditTrailAction.ROLE_DELETED,
            effects: [
                {
                    targetType: AuditTargetType.ROLE,
                    targetId: String(id),
                    before: {
                        name: role.name,
                        permissions: role.permissions,
                        sheetsTriggers: role.sheetsTriggers,
                    },
                },
            ],
        });

        return deleted;
    });
}
