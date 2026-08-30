import {prisma} from "@/lib/prisma";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {hasPermission} from "@/lib/permissions";

export default async function AdminAuditLogPage() {
    // Check if the user can access audit logs
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session) {
        redirect(`/login`); // this should already be caught by layout but wtv
    }
    const isAllowed = await hasPermission(session.user.id, "AUDIT_VIEW");
    if (!isAllowed) {
        redirect(`/403`);
    }

    return (
        <>
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
            </div>

            <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </>
    )
}