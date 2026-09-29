import Link from "next/link";
import {Metadata} from "next";
import {ArrowLeft, Check, CircleHelp, Clock3, RefreshCw, ShieldCheck, UserRound, Users, X} from "lucide-react";
import {listManagedUsers} from "@/lib/users";
import {refreshDirectoryAction, revokeAllUserSessionsAction, revokeUserSessionAction, syncAllUsersAction, syncUserAction} from "@/lib/users/actions";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {title: "Manage Users"};

function initials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default async function AdminManageUsersPage() {
    const users = await listManagedUsers();
    const linkedCount = users.filter((user) => user.directoryEntry !== null).length;

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div className="space-y-2">
                    <Button className="-ml-3" variant="ghost" render={<Link href="/dashboard/admin" />}><ArrowLeft /> Admin dashboard</Button>
                    <div className="flex items-start gap-3"><div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"><Users className="size-5" /></div><div><h1 className="text-3xl font-semibold tracking-tight">Manage users</h1><p className="mt-1 max-w-2xl text-muted-foreground">Inspect directory access, synchronize user roles, and manage active sessions.</p></div></div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <form action={refreshDirectoryAction}><Button type="submit" variant="outline"><RefreshCw /> Refresh directory</Button></form>
                    <form action={syncAllUsersAction}><Button type="submit"><Users /> Sync all users</Button></form>
                </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-3">
                <Card size="sm"><CardContent className="flex items-center gap-3"><Users className="size-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{users.length}</p><p className="text-sm text-muted-foreground">Registered users</p></div></CardContent></Card>
                <Card size="sm"><CardContent className="flex items-center gap-3"><ShieldCheck className="size-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{linkedCount}</p><p className="text-sm text-muted-foreground">Matched to directory</p></div></CardContent></Card>
                <Card size="sm"><CardContent className="flex items-center gap-3"><CircleHelp className="size-5 text-muted-foreground" /><div><p className="text-2xl font-semibold">{users.length - linkedCount}</p><p className="text-sm text-muted-foreground">Without directory match</p></div></CardContent></Card>
            </section>

            <section className="space-y-4">
                <div><h2 className="text-xl font-semibold">Registered users</h2><p className="mt-1 text-sm text-muted-foreground">Roles come from the synced directory. Account identity comes from Discord.</p></div>
                {users.length ? users.map((user) => (
                    <Card key={user.id}>
                        <CardHeader className="border-b">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div className="flex min-w-0 items-start gap-3">
                                    <Avatar className="size-11"><AvatarImage src={user.image ?? undefined} alt="" /><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>
                                    <div className="min-w-0 space-y-1">
                                        <CardTitle className="text-lg">{user.name}</CardTitle>
                                        <CardDescription>@{user.username} · Discord ID {user.discordID}</CardDescription>
                                        <div className="flex flex-wrap gap-1.5 pt-1">{user.roles.length ? user.roles.map((role) => <span key={role.id} className="rounded-full bg-primary/5 px-2.5 py-1 text-xs text-primary">{role.name}</span>) : <span className="text-xs text-muted-foreground">No roles assigned</span>}</div>
                                    </div>
                                </div>
                                <form action={syncUserAction}><input type="hidden" name="userId" value={user.id} /><Button type="submit" variant="outline"><RefreshCw /> Sync user</Button></form>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                            <section className="space-y-3">
                                <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-muted-foreground" /> Directory match</h3>
                                {user.directoryEntry ? (
                                    <div className="rounded-2xl bg-muted/30 p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-emerald-600" /> Matched</div>
                                        <p className="mt-2 text-sm">{user.directoryEntry.positionRaw || "No position recorded"}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Last directory sync: {new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(user.directoryEntry.syncedAt)}</p>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl bg-muted/30 p-4"><div className="flex items-center gap-2 text-sm font-medium"><X className="size-4 text-muted-foreground" /> No directory entry</div><p className="mt-2 text-sm text-muted-foreground">This account did not match a user in the directory. Refresh the directory and sync the user to check again.</p></div>
                                )}
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><UserRound className="size-4 text-muted-foreground" /> Sessions <span className="font-normal text-muted-foreground">({user.sessions.length})</span></h3>{user.sessions.length > 0 && <form action={revokeAllUserSessionsAction}><input type="hidden" name="userId" value={user.id} /><Button type="submit" size="sm" variant="destructive">Log out all</Button></form>}</div>
                                {user.sessions.length ? (
                                    <div className="space-y-2">
                                        {user.sessions.map((session) => {
                                            const expired = session.expiresAt.getTime() <= Date.now();
                                            return (
                                                <div key={session.id} className="flex items-start justify-between gap-3 rounded-2xl border p-3">
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="flex items-center gap-1.5 text-xs font-medium">{expired ? <Clock3 className="size-3.5 text-muted-foreground" /> : <Check className="size-3.5 text-emerald-600" />}{expired ? "Expired" : "Active"}<span className="font-normal text-muted-foreground">· Expires {new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(session.expiresAt)}</span></p>
                                                        <p className="text-xs text-muted-foreground">{session.ipAddress || "IP unavailable"}{session.userAgent ? ` · ${session.userAgent}` : ""}</p>
                                                        <p className="text-xs text-muted-foreground">Last active {new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(session.updatedAt)}</p>
                                                    </div>
                                                    <form action={revokeUserSessionAction} className="shrink-0"><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="sessionId" value={session.id} /><Button type="submit" size="sm" variant="outline" aria-label="Log out session">Log out</Button></form>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground">No persisted sessions.</p>}
                            </section>
                        </CardContent>
                    </Card>
                )) : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No users have signed in yet.</CardContent></Card>}
            </section>
        </div>
    );
}
