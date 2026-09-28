import {Metadata} from "next";
import {requirePermission} from "@/lib/permissions";
import {Permission} from "@/generated/prisma/enums";

export const metadata: Metadata = {
    title: "Admin",
};

export default async function AdminPage() {
    // honestly might just 404 this page
    await requirePermission([Permission.ADMINISTRATOR, Permission.CREATE, Permission.UPDATE, Permission.DELETE, Permission.AUDIT_VIEW]);
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