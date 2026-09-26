import AppLayoutClient from "../dashboard/layout-client"
import {requirePermission} from "@/lib/permissions";
import React from "react";
import {Permission} from "@/generated/prisma/enums";
import {getTabs} from "@/components/layout/sidebar-data";

export default async function AppLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const session = await requirePermission([Permission.ACCESS])

    const tabsData = await getTabs(session.user.id)

    return (
        <AppLayoutClient data={tabsData}>
            {children}
        </AppLayoutClient>
    )
}