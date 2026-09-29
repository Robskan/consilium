import Link from "next/link";
import {Metadata} from "next";
import {notFound} from "next/navigation";
import {ArrowDownToLine, ArrowLeft, CalendarDays, FileArchive, FileText, ShieldCheck} from "lucide-react";
import {getAccessibleFileDetails, getAccessibleFileName} from "@/lib/files";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {formatFileSize} from "@/lib/files/format";

type PageProps = {params: Promise<{id: string}>};

export async function generateMetadata({params}: PageProps): Promise<Metadata> {
    const {id} = await params;
    const fileId = Number(id);
    if (!Number.isInteger(fileId)) return {title: "File details"};
    return {title: (await getAccessibleFileName(fileId)) ?? "File details"};
}

export default async function FileDetailPage({params}: PageProps) {
    const {id} = await params;
    const fileId = Number(id);
    if (!Number.isInteger(fileId) || fileId < 1) notFound();

    const {file, canReadAll} = (await getAccessibleFileDetails(fileId)) ?? notFound();
    const visibleVersions = file.versions.filter((version) => canReadAll || !version.hidden);
    const latest = visibleVersions.find((version) => !version.hidden);

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
            <Button className="w-fit -ml-3" variant="ghost" render={<Link href="/dashboard/files" />}> <ArrowLeft /> Back to files</Button>

            <section className="flex flex-col justify-between gap-5 rounded-4xl bg-muted/40 p-6 sm:flex-row sm:items-end sm:p-8">
                <div className="space-y-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-primary shadow-sm"><FileText className="size-6" /></div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{file.name}</h1>
                        <p className="max-w-3xl whitespace-pre-wrap text-muted-foreground">{file.description || "No description provided."}</p>
                    </div>
                </div>
                {latest && <Button size="lg" render={<a href={`/api/files/${file.id}/versions/${latest.id}`} />}><ArrowDownToLine /> Download latest <span className="ml-1 opacity-75">v{latest.version}</span></Button>}
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileArchive className="size-5 text-muted-foreground" /> Versions</CardTitle>
                        <CardDescription>Release history and downloadable files.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {visibleVersions.length ? (
                            <div className="divide-y">
                                {visibleVersions.map((version) => (
                                    <div key={version.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-semibold">Version {version.version}</h2>
                                                {version.id === latest?.id && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Latest</span>}
                                                {version.hidden && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Restricted</span>}
                                            </div>
                                            <p className="truncate text-sm text-muted-foreground">{version.filename}</p>
                                            {version.notes && <p className="whitespace-pre-wrap pt-2 text-sm">{version.notes}</p>}
                                            <p className="text-xs text-muted-foreground">{formatFileSize(version.fileSize)} · {new Intl.DateTimeFormat(undefined, {dateStyle: "medium"}).format(version.createdAt)}</p>
                                        </div>
                                        <Button variant="outline" className="shrink-0" render={<a href={`/api/files/${file.id}/versions/${version.id}`} />}><ArrowDownToLine /> Download</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-muted/40 px-5 py-10 text-center">
                                <p className="font-medium">No versions available</p>
                                <p className="mt-1 text-sm text-muted-foreground">There are no published versions for this file yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <aside className="flex flex-col gap-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="size-4 text-muted-foreground" /> Access</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {file.requiredRoles.length ? <>
                                <p className="text-sm text-muted-foreground">Available to members with any of these roles:</p>
                                <div className="flex flex-wrap gap-1.5">{file.requiredRoles.map((role) => <span key={role.id} className="rounded-full bg-muted px-2.5 py-1 text-xs">{role.name}</span>)}</div>
                            </> : <p className="text-sm text-muted-foreground">Available to all users with file reading access.</p>}
                        </CardContent>
                    </Card>
                    <Card size="sm">
                        <CardContent className="flex items-start gap-3">
                            <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                            <div><p className="text-xs text-muted-foreground">Last updated</p><p className="mt-1 text-sm font-medium">{new Intl.DateTimeFormat(undefined, {dateStyle: "long"}).format(file.updatedAt)}</p></div>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
