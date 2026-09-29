import Link from "next/link";
import {Metadata} from "next";
import {ArrowLeft, KeyRound, Plus, Shield, Trash2, Users, FileText} from "lucide-react";
import {Permission} from "@/generated/prisma/enums";
import {createRoleAction, deleteRoleAction, updateRoleAction} from "@/lib/roles/actions";
import {getRoleManagementData} from "@/lib/roles";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {title: "Manage Roles"};

const permissionDescriptions: Record<Permission, string> = {
    ACCESS: "Sign in and use the application",
    CREATE: "Create files and upload versions",
    READ: "Read files the user has access to",
    UPDATE: "Edit accessible files and versions",
    DELETE: "Delete and restore accessible files and versions",
    READ_ALL: "Read every file and hidden version",
    AUDIT_VIEW: "View the audit log",
    ADMINISTRATOR: "Manage roles and users",
};

function PermissionOptions({allowed, selected = []}: {allowed: Permission[]; selected?: Permission[]}) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {Object.values(Permission).map((permission) => {
                const checked = selected.includes(permission);
                const enabled = allowed.includes(permission) || checked;
                return (
                    <label key={permission} className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${enabled ? "cursor-pointer bg-background hover:bg-muted/50" : "cursor-not-allowed bg-muted/30 opacity-60"}`}>
                        <input type="checkbox" name="permissions" value={permission} defaultChecked={checked} disabled={!enabled} className="mt-0.5 size-4 accent-primary" />
                        <span className="grid gap-1"><span className="text-sm font-medium">{permission.replaceAll("_", " ")}</span><span className="text-xs text-muted-foreground">{permissionDescriptions[permission]}</span>{!enabled && <span className="text-xs text-muted-foreground">You do not have this permission to grant.</span>}</span>
                    </label>
                );
            })}
        </div>
    );
}

export default async function AdminManageRolesPage() {
    const {roles, actorPermissions} = await getRoleManagementData();
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
            <div className="space-y-2">
                <Button className="-ml-3" variant="ghost" render={<Link href="/dashboard/admin" />}><ArrowLeft /> Admin dashboard</Button>
                <div className="flex items-start gap-3"><div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"><KeyRound className="size-5" /></div><div><h1 className="text-3xl font-semibold tracking-tight">Manage roles</h1><p className="mt-1 text-muted-foreground">Roles grant application permissions and can be assigned automatically from directory positions.</p></div></div>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5 text-muted-foreground" /> Create a role</CardTitle><CardDescription>Choose the permissions and directory position names that should grant this role.</CardDescription></CardHeader>
                <CardContent>
                    <form action={createRoleAction} className="grid gap-5">
                        <div className="grid gap-2"><Label htmlFor="new-role-name">Role name</Label><Input id="new-role-name" name="name" required maxLength={100} placeholder="Operations" /></div>
                        <div className="grid gap-2"><Label htmlFor="new-role-triggers">Directory position triggers</Label><Textarea id="new-role-triggers" name="sheetsTriggers" placeholder={"One position per line\nExample: Operations Officer"} /><p className="text-xs text-muted-foreground">When a directory position matches one of these values, the user receives this role.</p></div>
                        <fieldset className="grid gap-3"><legend className="text-sm font-medium">Permissions you can grant</legend><PermissionOptions allowed={actorPermissions} /></fieldset>
                        <div><Button type="submit"><Plus /> Create role</Button></div>
                    </form>
                </CardContent>
            </Card>

            <section className="space-y-4">
                <div><h2 className="text-xl font-semibold">Existing roles</h2><p className="mt-1 text-sm text-muted-foreground">{roles.length} {roles.length === 1 ? "role" : "roles"} configured.</p></div>
                {roles.length ? roles.map((role) => (
                    <Card key={role.id}>
                        <CardHeader className="border-b">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <div className="space-y-2"><CardTitle className="text-lg">{role.name}</CardTitle><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"><Users className="size-3.5" /> {role._count.users} users</span><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1"><FileText className="size-3.5" /> {role._count.files} files</span></div></div>
                                <div className="flex flex-wrap gap-1.5">{role.permissions.length ? role.permissions.map((permission) => <span key={permission} className="rounded-full bg-primary/5 px-2.5 py-1 text-xs text-primary">{permission.replaceAll("_", " ")}</span>) : <span className="text-xs text-muted-foreground">No permissions</span>}</div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                            <form action={updateRoleAction} className="grid content-start gap-4">
                                <input type="hidden" name="roleId" value={role.id} />
                                <h3 className="font-medium">Role settings</h3>
                                <div className="grid gap-2"><Label htmlFor={`role-name-${role.id}`}>Role name</Label><Input id={`role-name-${role.id}`} name="name" required defaultValue={role.name} /></div>
                                <fieldset className="grid gap-3"><legend className="text-sm font-medium">Directory position triggers</legend><Textarea name="sheetsTriggers" aria-label={`Directory position triggers for ${role.name}`} defaultValue={role.sheetsTriggers.join("\n")} placeholder="One position per line" /><p className="text-xs text-muted-foreground">One exact position name per line. Leave blank for a role assigned manually through directory rules.</p></fieldset>
                                <fieldset className="grid gap-3"><legend className="text-sm font-medium">Permissions</legend><PermissionOptions allowed={actorPermissions} selected={role.permissions} /></fieldset>
                                <div><Button type="submit" variant="secondary">Save role</Button></div>
                            </form>
                            <aside className="flex flex-col justify-between gap-4 rounded-2xl bg-muted/30 p-4">
                                <div><div className="flex items-center gap-2 font-medium"><Shield className="size-4 text-muted-foreground" /> Remove role</div><p className="mt-2 text-sm text-muted-foreground">A role can only be deleted when it is not assigned to users and is not required by files.</p></div>
                                <form action={deleteRoleAction}>
                                    <input type="hidden" name="roleId" value={role.id} />
                                    <Button type="submit" variant="destructive" disabled={role._count.users > 0 || role._count.files > 0}><Trash2 /> Delete role</Button>
                                    {(role._count.users > 0 || role._count.files > 0) && <p className="mt-2 text-xs text-muted-foreground">Remove its {role._count.users > 0 ? "user assignments" : "file requirements"} first.</p>}
                                </form>
                            </aside>
                        </CardContent>
                    </Card>
                )) : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No roles have been configured yet.</CardContent></Card>}
            </section>
        </div>
    );
}
