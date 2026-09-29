import Link from "next/link";
import {Metadata} from "next";
import {ArrowRight, ClipboardList, Files, KeyRound, ShieldCheck, Users, Wrench} from "lucide-react";
import {Permission} from "@/generated/prisma/enums";
import {requirePermissionWithAccess} from "@/lib/permissions";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

export const metadata: Metadata = {title: "Admin"};

export default async function AdminPage() {
    const {access} = await requirePermissionWithAccess([
        Permission.ADMINISTRATOR,
        Permission.CREATE,
        Permission.UPDATE,
        Permission.DELETE,
        Permission.AUDIT_VIEW,
    ]);
    const permissions = access.permissions;
    const isAdministrator = permissions.includes(Permission.ADMINISTRATOR);
    const canManageFiles = [Permission.CREATE, Permission.UPDATE, Permission.DELETE].some((permission) => permissions.includes(permission));
    const canViewAudit = permissions.includes(Permission.AUDIT_VIEW);

    const tools = [
        ...(canManageFiles ? [{title: "Manage files", description: "Create files, publish versions, set access roles, and restore deleted resources.", href: "/dashboard/admin/manage-files", icon: Files, action: "Manage library"}] : []),
        ...(isAdministrator ? [{title: "Manage roles", description: "Configure application permissions and directory position triggers.", href: "/dashboard/admin/manage-roles", icon: KeyRound, action: "Configure roles"}] : []),
        ...(isAdministrator ? [{title: "Manage users", description: "Review directory matches, synchronize roles, and manage user sessions.", href: "/dashboard/admin/manage-users", icon: Users, action: "Manage accounts"}] : []),
        ...(canViewAudit ? [{title: "Audit log", description: "Review recorded activity across users, roles, files, and versions.", href: "/dashboard/admin/audit-log", icon: ClipboardList, action: "View activity"}] : []),
    ];

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
            <section className="space-y-3 rounded-4xl bg-muted/40 p-6 sm:p-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow-sm"><Wrench className="size-5" /></div>
                <div><p className="text-sm font-medium text-muted-foreground">Consilium administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin dashboard</h1><p className="mt-2 max-w-2xl text-muted-foreground">Manage the file library, access roles, and user accounts from one place.</p></div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                {tools.map(({title, description, href, icon: Icon, action}) => (
                    <Card key={href} className="justify-between">
                        <CardHeader>
                            <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Icon className="size-5" /></div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <CardDescription className="max-w-xl">{description}</CardDescription>
                        </CardHeader>
                        <CardContent><Button variant="secondary" render={<Link href={href} />}>{action}<ArrowRight /></Button></CardContent>
                    </Card>
                ))}
            </section>

            <Card size="sm">
                <CardContent className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-muted-foreground" /><div><p className="font-medium">Access is permission based</p><p className="mt-1 text-sm text-muted-foreground">Administrative tools shown here reflect your current role permissions. Each action checks authorization again on the server.</p></div></CardContent>
            </Card>
        </div>
    );
}
