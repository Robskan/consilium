import Link from "next/link";
import {Metadata} from "next";
import {ArrowLeft, ChevronLeft, ChevronRight, ClipboardList, Filter, UserRound} from "lucide-react";
import {AuditTargetType, AuditTrailAction} from "@/generated/prisma/enums";
import {listAuditEvents} from "@/lib/audit/query";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {title: "Audit Log"};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function parseDate(value: string | undefined, endOfDay = false) {
    if (!value) return undefined;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return undefined;
    if (endOfDay) date.setUTCHours(23, 59, 59, 999);
    return date;
}

function humanize(value: string) {
    return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function jsonText(value: unknown) {
    return JSON.stringify(value, null, 2);
}

function pageHref(page: number, filters: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return `/dashboard/admin/audit-log${query ? `?${query}` : ""}`;
}

export default async function AdminAuditLogPage({searchParams}: {searchParams: SearchParams}) {
    const params = await searchParams;
    const rawAction = first(params.action);
    const rawTargetType = first(params.targetType);
    const action = Object.values(AuditTrailAction).includes(rawAction as AuditTrailAction) ? rawAction as AuditTrailAction : undefined;
    const targetType = Object.values(AuditTargetType).includes(rawTargetType as AuditTargetType) ? rawTargetType as AuditTargetType : undefined;
    const rawPage = Number(first(params.page) ?? "1");
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
    const userId = first(params.userId)?.trim() || undefined;
    const targetId = first(params.targetId)?.trim() || undefined;
    const fromRaw = first(params.from);
    const toRaw = first(params.to);
    const from = parseDate(fromRaw);
    const to = parseDate(toRaw, true);

    const result = await listAuditEvents({
        page,
        pageSize: 25,
        userId,
        action,
        targetType,
        targetId,
        from,
        to,
    });
    const filters = {action, targetType, userId, targetId, from: fromRaw, to: toRaw};

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4">
            <div className="space-y-2">
                <Button className="-ml-3" variant="ghost" render={<Link href="/dashboard/admin" />}><ArrowLeft /> Admin dashboard</Button>
                <div className="flex items-start gap-3"><div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary"><ClipboardList className="size-5" /></div><div><h1 className="text-3xl font-semibold tracking-tight">Audit log</h1><p className="mt-1 max-w-2xl text-muted-foreground">Review recorded activity and changes across users, roles, files, and versions.</p></div></div>
            </div>

            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Filter className="size-4 text-muted-foreground" /> Filter events</CardTitle><CardDescription>Combine filters to narrow the results. Actor and target IDs match exact values.</CardDescription></CardHeader>
                <CardContent>
                    <form method="get" action="/dashboard/admin/audit-log" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="grid gap-2"><Label htmlFor="filter-action">Action</Label><select id="filter-action" name="action" defaultValue={action ?? ""} className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"><option value="">All actions</option>{Object.values(AuditTrailAction).map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></div>
                        <div className="grid gap-2"><Label htmlFor="filter-target-type">Target type</Label><select id="filter-target-type" name="targetType" defaultValue={targetType ?? ""} className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"><option value="">All target types</option>{Object.values(AuditTargetType).map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></div>
                        <div className="grid gap-2"><Label htmlFor="filter-user">Actor user ID</Label><Input id="filter-user" name="userId" defaultValue={userId} placeholder="Exact user ID" /></div>
                        <div className="grid gap-2"><Label htmlFor="filter-target">Target ID</Label><Input id="filter-target" name="targetId" defaultValue={targetId} placeholder="Exact file, user, role, or version ID" /></div>
                        <div className="grid gap-2"><Label htmlFor="filter-from">From</Label><Input id="filter-from" name="from" type="date" defaultValue={fromRaw} /></div>
                        <div className="grid gap-2"><Label htmlFor="filter-to">To</Label><Input id="filter-to" name="to" type="date" defaultValue={toRaw} /></div>
                        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2"><Button type="submit"><Filter /> Apply filters</Button><Button variant="outline" render={<Link href="/dashboard/admin/audit-log" />}>Clear</Button></div>
                    </form>
                </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{result.total.toLocaleString()} {result.total === 1 ? "event" : "events"} · Page {result.page} of {Math.max(result.totalPages, 1)}</p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={result.page <= 1} render={<Link href={pageHref(result.page - 1, filters)} />}><ChevronLeft /> Previous</Button>
                    <Button size="sm" variant="outline" disabled={result.page >= result.totalPages} render={<Link href={pageHref(result.page + 1, filters)} />}>Next <ChevronRight /></Button>
                </div>
            </div>

            {result.events.length ? <section className="space-y-3">
                {result.events.map((event) => (
                    <Card key={event.id}>
                        <CardHeader>
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">{humanize(event.action)}</span><span className="text-xs text-muted-foreground">Event #{event.id}</span></div>
                                    <CardTitle className="flex items-center gap-2 text-base"><UserRound className="size-4 text-muted-foreground" />{event.user.name}<span className="font-normal text-muted-foreground">@{event.user.username}</span></CardTitle>
                                    <CardDescription>User ID: <span className="font-mono">{event.userId}</span>{event.user.discordID && <> · Discord ID: <span className="font-mono">{event.user.discordID}</span></>}</CardDescription>
                                </div>
                                <time className="shrink-0 text-sm text-muted-foreground" dateTime={event.timestamp.toISOString()}>{new Intl.DateTimeFormat(undefined, {dateStyle: "medium", timeStyle: "short"}).format(event.timestamp)}</time>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {event.auditTrailEffects.length ? <div className="space-y-2">
                                {event.auditTrailEffects.map((effect) => (
                                    <div key={effect.id} className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="text-sm font-medium">{humanize(effect.targetType)} <span className="font-mono text-muted-foreground">#{effect.targetId}</span></p>
                                        {(effect.before !== null || effect.after !== null) && <details className="mt-3">
                                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">View recorded changes</summary>
                                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                {effect.before !== null && <div className="min-w-0"><p className="mb-1 text-xs font-medium text-muted-foreground">Before</p><pre className="max-h-80 overflow-auto rounded-xl bg-background p-3 text-xs whitespace-pre-wrap break-all">{jsonText(effect.before)}</pre></div>}
                                                {effect.after !== null && <div className="min-w-0"><p className="mb-1 text-xs font-medium text-muted-foreground">After</p><pre className="max-h-80 overflow-auto rounded-xl bg-background p-3 text-xs whitespace-pre-wrap break-all">{jsonText(effect.after)}</pre></div>}
                                            </div>
                                        </details>}
                                    </div>
                                ))}
                            </div> : null}
                            {event.metadata !== null && <details><summary className="cursor-pointer text-xs font-medium text-muted-foreground">View event metadata</summary><pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-muted/30 p-3 text-xs whitespace-pre-wrap break-all">{jsonText(event.metadata)}</pre></details>}
                            {(event.ip || event.ua) && <details><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Request details</summary><div className="mt-2 grid gap-1 rounded-xl bg-muted/30 p-3 text-xs"><p><span className="font-medium">IP:</span> {event.ip ?? "Unavailable"}</p><p className="break-all"><span className="font-medium">User agent:</span> {event.ua ?? "Unavailable"}</p></div></details>}
                        </CardContent>
                    </Card>
                ))}
            </section> : <Card><CardContent className="py-14 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No events found</h2><p className="mt-1 text-sm text-muted-foreground">Try changing or clearing the filters.</p></CardContent></Card>}

            <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" disabled={result.page <= 1} render={<Link href={pageHref(result.page - 1, filters)} />}><ChevronLeft /> Previous</Button>
                <Button size="sm" variant="outline" disabled={result.page >= result.totalPages} render={<Link href={pageHref(result.page + 1, filters)} />}>Next <ChevronRight /></Button>
            </div>
        </div>
    );
}
