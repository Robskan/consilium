import {Files, ShieldUser} from "lucide-react";
import * as React from "react";
import {prisma} from "@/lib/prisma";
import {listPermissions} from "@/lib/permissions";
export type NavItem = {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
        title: string
        url: string
        isActive?: boolean
    }[]
}
export type Tabs = {
    user: {
        name: string
        role: string
        avatar: string
    }
    navMain: NavItem[]
}

export async function getTabs(userId?: string): Promise<Tabs> {
    const nullData: Tabs = {
        user: {
            name: "Undefined",
            role: "Undefined",
            avatar: "https://placehold.net/400x400.png",
        },
        navMain: [],
    }

    if (!userId) {
        return nullData;
    }
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            roles: true,
        },
    })
    if (!user) {
        return nullData
    }
    const permissions = await listPermissions(user?.id);
    const shouldShowAdmin = permissions.some((p) => ["CREATE", "UPDATE", "DELETE", "ADMINISTRATOR", "AUDIT_VIEW"].includes(p));
    const shouldShowManageFiles = permissions.some((p) => ["CREATE", "UPDATE", "DELETE"].includes(p));
    const shouldShowManageRoles = permissions.some((p) => ["ADMINISTRATOR"].includes(p));
    const shouldShowAudit = permissions.some((p) => ["AUDIT_VIEW"].includes(p));
    return {
        user: {
            name: user.name,
            role: user.roles[0]?.name ?? "User",
            avatar: user?.image ?? "https://placehold.net/400x400.png",
        },
        navMain: [
            {
                title: "Files",
                url: "/dashboard/files",
                icon: (
                    <Files
                    />
                ),
            },
            shouldShowAdmin && {
                title: "Admin",
                url: "/dashboard/admin",
                icon: (
                    <ShieldUser
                    />
                ),
                items: [
                    shouldShowAudit && {
                        title: "Audit Log",
                        url: "/dashboard/admin/audit-log",
                    },
                    shouldShowManageFiles && {
                        title: "Manage Files",
                        url: "/dashboard/admin/manage-files",
                    },
                    shouldShowManageRoles && {
                        title: "Manage Roles",
                        url: "/dashboard/admin/manage-roles",
                    },
                ].filter(Boolean),
            },
        ].filter(Boolean) as NavItem[],
    };
}