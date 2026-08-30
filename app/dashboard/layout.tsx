import { redirect } from "next/navigation"
import AppLayoutClient from "../dashboard/layout-client"
import {hasPermission} from "@/lib/permissions";
import React from "react";
import {getUserId} from "@/lib/user";
import {getTabs} from "@/components/layout/sidebar-data";

export default async function AppLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    const userId = await getUserId()
    if (!userId) {
        redirect(`/login`);
    }

    // Check if the user can access the app
    const isAllowed = await hasPermission(userId, "ACCESS");
    if (!isAllowed) {
        redirect(`/403`);
    }

    const tabsData = await getTabs(userId)

    return (
        <AppLayoutClient data={tabsData}>
            {children}
        </AppLayoutClient>
    )
}