import Link from "next/link";
import {Metadata} from "next";
import {ArrowDownToLine, FileText, FolderOpen, Search} from "lucide-react";
import {listReadableFiles} from "@/lib/files";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

export const metadata: Metadata = {title: "Files"};

export default async function FilesPage() {
    const {files, canCreate} = await listReadableFiles();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><FolderOpen className="size-4" /> Library</div>
                    <h1 className="text-3xl font-semibold tracking-tight">Files</h1>
                    <p className="max-w-2xl text-muted-foreground">Browse the latest approved resources and download the version you need.</p>
                </div>
                {canCreate && <Button render={<Link href="/dashboard/admin/manage-files" />}>Manage files</Button>}
            </section>

            {files.length ? (
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {files.map((file) => {
                        const latest = file.versions[0];
                        return (
                            <Card key={file.id} className="justify-between">
                                <CardHeader>
                                    <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/5 text-primary"><FileText className="size-5" /></div>
                                    <CardTitle className="text-lg">{file.name}</CardTitle>
                                    <CardDescription className="line-clamp-3 min-h-15">{file.description || "No description provided."}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex min-h-6 flex-wrap gap-1.5">
                                        {file.requiredRoles.length ? file.requiredRoles.map(({name}) => <span key={name} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{name}</span>) : <span className="text-xs text-muted-foreground">Available to all readers</span>}
                                    </div>
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <div className="text-sm">
                                            {latest ? <><span className="font-medium">v{latest.version}</span><span className="ml-2 text-muted-foreground">{new Intl.DateTimeFormat(undefined, {dateStyle: "medium"}).format(latest.createdAt)}</span></> : <span className="text-muted-foreground">No available versions</span>}
                                        </div>
                                        {latest ? <Button size="icon-sm" variant="outline" aria-label={`Download ${file.name} v${latest.version}`} render={<a href={`/api/files/${file.id}/versions/${latest.id}`} />}><ArrowDownToLine /></Button> : null}
                                    </div>
                                    <Button className="w-full" variant="secondary" render={<Link href={`/dashboard/files/${file.id}`} />}>View details</Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>
            ) : (
                <Card className="items-center py-14 text-center">
                    <CardContent className="flex max-w-md flex-col items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Search className="size-5 text-muted-foreground" /></div>
                        <h2 className="text-lg font-semibold">No files available</h2>
                        <p className="text-sm text-muted-foreground">There are no files available for your account yet. Check back later or contact an administrator if you think you should have access.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
