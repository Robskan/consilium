import Link from "next/link";
import {Metadata} from "next";
import {ArrowDownToLine, ArrowLeft, FilePlus2, FileText, LockKeyhole, Plus, RotateCcw, Settings2, Trash2, Upload} from "lucide-react";
import {getFileManagementData} from "@/lib/files";
import {
    createFileAction,
    createVersionAction,
    deleteFileAction,
    deleteVersionAction,
    restoreFileAction,
    restoreVersionAction,
    updateFileAction,
    updateVersionAction,
} from "@/lib/files/actions";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {formatFileSize} from "@/lib/files/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {title: "Manage Files"};

function RoleOptions({roles, selectedIds = []}: {roles: {id: number; name: string}[]; selectedIds?: number[]}) {
    if (!roles.length) return <p className="text-sm text-muted-foreground">No roles have been configured. Leaving all unchecked makes this file available to all readers.</p>;
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((role) => (
                <label key={role.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background px-3 py-2.5 text-sm hover:bg-muted/50">
                    <input type="checkbox" name="requiredRoleIds" value={role.id} defaultChecked={selectedIds.includes(role.id)} className="size-4 accent-primary" />
                    {role.name}
                </label>
            ))}
        </div>
    );
}

export default async function AdminManageFilesPage() {
    const {files, roles, canCreate, canUpdate, canDelete} = await getFileManagementData();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                    <Button className="-ml-3" variant="ghost" render={<Link href="/dashboard/files" />}><ArrowLeft /> Back to files</Button>
                    <h1 className="text-3xl font-semibold tracking-tight">Manage files</h1>
                    <p className="text-muted-foreground">Create resources, publish versions, and manage who can access them.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {canCreate && <span className="rounded-full bg-muted px-3 py-1.5">Create and upload</span>}
                    {canUpdate && <span className="rounded-full bg-muted px-3 py-1.5">Edit resources</span>}
                    {canDelete && <span className="rounded-full bg-muted px-3 py-1.5">Delete and restore</span>}
                </div>
            </div>

            {canCreate && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FilePlus2 className="size-5 text-muted-foreground" /> Add a file</CardTitle>
                        <CardDescription>Create a library entry and upload its first version.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createFileAction} encType="multipart/form-data" className="grid gap-6">
                            <div className="grid gap-5 md:grid-cols-2">
                                <div className="grid gap-2"><Label htmlFor="new-name">Name</Label><Input id="new-name" name="name" required maxLength={160} placeholder="Operations handbook" /></div>
                                <div className="grid gap-2"><Label htmlFor="new-version">Initial version</Label><Input id="new-version" name="version" required placeholder="1.0.0" /></div>
                            </div>
                            <div className="grid gap-2"><Label htmlFor="new-description">Description</Label><Textarea id="new-description" name="description" required placeholder="What is this file and who is it for?" /></div>
                            <div className="grid gap-2"><Label htmlFor="new-upload">File</Label><Input id="new-upload" name="file" type="file" required /></div>
                            <div className="grid gap-2"><Label htmlFor="new-notes">Release notes</Label><Textarea id="new-notes" name="notes" placeholder="What changed in this version?" /></div>
                            <fieldset className="grid gap-3"><legend className="text-sm font-medium">Required roles</legend><p className="-mt-2 text-sm text-muted-foreground">Anyone with one of the selected roles can access this file. Leave all unchecked for general reader access.</p><RoleOptions roles={roles} /></fieldset>
                            <div><Button type="submit"><Plus /> Create file</Button></div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div><h2 className="text-xl font-semibold">Existing files</h2><p className="mt-1 text-sm text-muted-foreground">{files.length} {files.length === 1 ? "file" : "files"} available for you to manage.</p></div>
                </div>
                {files.length ? files.map((file) => {
                    const deleted = file.deletedAt !== null;
                    return (
                        <Card key={file.id} className={deleted ? "opacity-75" : ""}>
                            <CardHeader className="border-b">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                    <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <CardTitle className="text-lg">{file.name}</CardTitle>
                                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{file.versions.length} {file.versions.length === 1 ? "version" : "versions"}</span>
                                            {deleted && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">Deleted</span>}
                                        </div>
                                        <CardDescription className="max-w-3xl whitespace-pre-wrap">{file.description || "No description provided."}</CardDescription>
                                        <div className="flex flex-wrap gap-1.5">
                                            {file.requiredRoles.length ? file.requiredRoles.map((role) => <span key={role.id} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{role.name}</span>) : <span className="text-xs text-muted-foreground">Available to all readers</span>}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {deleted && canDelete ? <form action={restoreFileAction}><input type="hidden" name="fileId" value={file.id} /><Button type="submit" variant="outline"><RotateCcw /> Restore file</Button></form> : null}
                                        {!deleted && canUpdate ? <Button variant="outline" render={<a href={`#edit-file-${file.id}`} />}><Settings2 /> Edit</Button> : null}
                                        {!deleted && canCreate && <Button variant="outline" render={<a href={`#new-version-${file.id}`} />}><Upload /> New version</Button>}
                                        {!deleted && canDelete ? <form action={deleteFileAction}><input type="hidden" name="fileId" value={file.id} /><Button type="submit" variant="destructive"><Trash2 /> Delete</Button></form> : null}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 lg:grid-cols-2">
                                {!deleted && canUpdate && (
                                    <form id={`edit-file-${file.id}`} action={updateFileAction} className="grid content-start gap-4 rounded-2xl bg-muted/30 p-4">
                                        <input type="hidden" name="fileId" value={file.id} />
                                        <h3 className="font-medium">File details and access</h3>
                                        <div className="grid gap-2"><Label htmlFor={`name-${file.id}`}>Name</Label><Input id={`name-${file.id}`} name="name" required defaultValue={file.name} /></div>
                                        <div className="grid gap-2"><Label htmlFor={`description-${file.id}`}>Description</Label><Textarea id={`description-${file.id}`} name="description" defaultValue={file.description} /></div>
                                        <fieldset className="grid gap-3"><legend className="text-sm font-medium">Required roles</legend><RoleOptions roles={roles} selectedIds={file.requiredRoles.map((role) => role.id)} /></fieldset>
                                        <Button type="submit" variant="secondary">Save file changes</Button>
                                    </form>
                                )}

                                {!deleted && canCreate && (
                                    <form id={`new-version-${file.id}`} action={createVersionAction} encType="multipart/form-data" className="grid content-start gap-4 rounded-2xl bg-muted/30 p-4">
                                        <input type="hidden" name="fileId" value={file.id} />
                                        <h3 className="font-medium">Upload a new version</h3>
                                        <div className="grid gap-2"><Label htmlFor={`version-${file.id}`}>Version</Label><Input id={`version-${file.id}`} name="version" required placeholder="1.1.0" /></div>
                                        <div className="grid gap-2"><Label htmlFor={`upload-${file.id}`}>File</Label><Input id={`upload-${file.id}`} name="file" type="file" required /></div>
                                        <div className="grid gap-2"><Label htmlFor={`notes-${file.id}`}>Release notes</Label><Textarea id={`notes-${file.id}`} name="notes" placeholder="What changed in this version?" /></div>
                                        <Button type="submit" variant="secondary"><Upload /> Upload version</Button>
                                    </form>
                                )}

                                {file.versions.length > 0 && (
                                    <div className="space-y-3 lg:col-span-2">
                                        <h3 className="font-medium">Version history</h3>
                                        <div className="divide-y rounded-2xl border">
                                            {file.versions.map((version) => (
                                                <div key={version.id} className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between ${version.deletedAt ? "opacity-60" : ""}`}>
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium">v{version.version}</span>
                                                            {version.hidden && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"><LockKeyhole className="size-3" /> Hidden</span>}
                                                            {version.deletedAt && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">Deleted</span>}
                                                            <span className="text-xs text-muted-foreground">{formatFileSize(version.fileSize)} · {version.filename}</span>
                                                        </div>
                                                        {!version.deletedAt && canUpdate ? (
                                                            <form action={updateVersionAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                                                                <input type="hidden" name="fileId" value={version.id} />
                                                                <div className="grid gap-2"><Label htmlFor={`version-notes-${version.id}`}>Release notes</Label><Textarea id={`version-notes-${version.id}`} name="notes" defaultValue={version.notes} className="min-h-16" /></div>
                                                                <div className="grid gap-2"><Label htmlFor={`visibility-${version.id}`}>Visibility</Label><select id={`visibility-${version.id}`} name="hidden" defaultValue={String(version.hidden)} className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"><option value="false">Visible</option><option value="true">Restricted</option></select></div>
                                                                <Button type="submit" size="sm" variant="secondary">Save version</Button>
                                                            </form>
                                                        ) : <p className="whitespace-pre-wrap text-sm text-muted-foreground">{version.notes || "No release notes."}</p>}
                                                    </div>
                                                    <div className="flex shrink-0 gap-2">
                                                        {!version.deletedAt && !deleted && <Button size="sm" variant="outline" render={<a href={`/api/files/${file.id}/versions/${version.id}`} />}><ArrowDownToLine /> Download</Button>}
                                                        {version.deletedAt && canDelete ? <form action={restoreVersionAction}><input type="hidden" name="fileId" value={version.id} /><Button type="submit" size="sm" variant="outline"><RotateCcw /> Restore</Button></form> : null}
                                                        {!version.deletedAt && !deleted && canDelete ? <form action={deleteVersionAction}><input type="hidden" name="fileId" value={version.id} /><Button type="submit" size="sm" variant="destructive" aria-label={`Delete version ${version.version}`}><Trash2 /></Button></form> : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {file.versions.length === 0 && <p className="text-sm text-muted-foreground">No versions have been uploaded yet.</p>}
                            </CardContent>
                        </Card>
                    );
                }) : (
                    <Card><CardContent className="flex flex-col items-center gap-2 py-12 text-center"><FileText className="size-8 text-muted-foreground" /><p className="font-medium">No files to manage</p><p className="text-sm text-muted-foreground">{canCreate ? "Create the first file above." : "There are no files available to you with your current file access."}</p></CardContent></Card>
                )}
            </section>
        </div>
    );
}
