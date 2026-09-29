"use server";

import {revalidatePath} from "next/cache";
import {createFile, createVersion} from "@/lib/files/create";
import semver from "semver";
import {updateFile, updateVersion} from "@/lib/files/update";
import {deleteFile, deleteVersion, restoreFile, restoreVersion} from "@/lib/files/delete";
import mime from "mime-types";

const FILES_PATH = "/dashboard/files";
const MANAGE_FILES_PATH = "/dashboard/admin/manage-files";

function readInteger(formData: FormData, key: string, label: string): number {
    const value = formData.get(key);
    const id = typeof value === "string" ? Number(value) : Number.NaN;
    if (!Number.isInteger(id) || id < 1) throw new Error(`Invalid ${label}`);
    return id;
}

function readRoleIds(formData: FormData): number[] {
    return formData.getAll("requiredRoleIds").map((value) => {
        const id = typeof value === "string" ? Number(value) : Number.NaN;
        if (!Number.isInteger(id) || id < 1) throw new Error("Invalid role ID");
        return id;
    });
}

function revalidateFilePaths(fileId?: number) {
    revalidatePath(FILES_PATH);
    revalidatePath(MANAGE_FILES_PATH);
    if (fileId) revalidatePath(`${FILES_PATH}/${fileId}`);
}

export async function createFileAction(formData: FormData): Promise<void> {
    const name = formData.get("name");
    const description = formData.get("description");
    const version = formData.get("version");
    const notes = formData.get("notes");
    const upload = formData.get("file");
    if (typeof name !== "string" || !name.trim()) {
        throw new Error("File name is required");
    }

    if (typeof description !== "string") {
        throw new Error("Description is required");
    }

    if (typeof version !== "string" || !version.trim()) {
        throw new Error("Version is required");
    }

    if (!semver.valid(semver.coerce(version))) {
        throw new Error("Version is invalid");
    }

    const requiredRoleIds = readRoleIds(formData);

    if (!(upload instanceof File)) {
        throw new Error("A file is required");
    }

    const mimeType = await validateFile(upload);

    const data = Buffer.from(await upload.arrayBuffer());


    const created = await createFile({
        name: name.trim(),
        description: description.trim(),

        requiredRoleIds,

        version: version.trim(),
        filename: upload.name,
        data,
        mimeType,

        notes: typeof notes === "string"
            ? notes.trim()
            : "No release notes",
    });
    revalidateFilePaths(created.id);
}

export async function createVersionAction(formData: FormData): Promise<void> {
    const fileId = readInteger(formData, "fileId", "file ID");
    const version = formData.get("version");
    const notes = formData.get("notes");
    const upload = formData.get("file");

    if (typeof version !== "string" || !version.trim()) {
        throw new Error("Version is required");
    }

    if (!semver.valid(semver.coerce(version))) {
        throw new Error("Version is invalid");
    }

    if (!(upload instanceof File)) {
        throw new Error("A file is required");
    }

    await validateFile(upload);

    const data = Buffer.from(await upload.arrayBuffer());

    const created = await createVersion({
        fileId,
        version: version.trim(),
        filename: upload.name,
        data,
        notes: typeof notes === "string"
            ? notes.trim()
            : "No release notes",
    });
    revalidateFilePaths(created.fileId);
}

export async function updateFileAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "file ID");
    const name = formData.get("name");
    const description = formData.get("description");

    const requiredRoleIds = readRoleIds(formData);

    await updateFile({
        id,
        name: typeof name === "string"
            ? name.trim()
            : undefined,
        requiredRoleIds,
        description: typeof description === "string"
            ? description.trim()
            : undefined,
    });
    revalidateFilePaths(id);
}

export async function updateVersionAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "version ID");
    const notes = formData.get("notes");
    const hidden = formData.get("hidden");

    const updated = await updateVersion({
        id,
        notes: typeof notes === "string"
            ? notes.trim()
            : undefined,
        hidden: hidden === "true"
            ? true
            : hidden === "false"
                ? false
                : undefined
    });
    revalidateFilePaths(updated.fileId);
}

export async function deleteFileAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "file ID");
    await deleteFile(id);
    revalidateFilePaths(id);
}

export async function deleteVersionAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "version ID");
    const deleted = await deleteVersion(id);
    revalidateFilePaths(deleted.fileId);
}

export async function restoreFileAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "file ID");
    await restoreFile(id);
    revalidateFilePaths(id);
}

export async function restoreVersionAction(formData: FormData): Promise<void> {
    const id = readInteger(formData, "fileId", "version ID");
    const restored = await restoreVersion(id);
    revalidateFilePaths(restored.fileId);
}

async function validateFile(upload: File): Promise<string> {
    const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50 MB default
    const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || "").split(",").map(type => type.trim()).filter(Boolean);
    const resolvedMimeType = mime.lookup(upload.name) || "application/octet-stream";

    if (upload.size > MAX_FILE_SIZE) {
        throw new Error("File is too large");
    }
    if (upload.name.length > 255) {
        throw new Error("Filename is too long");
    }
    if (ALLOWED_FILE_TYPES.length > 0 && !ALLOWED_FILE_TYPES.includes(resolvedMimeType)) {
        throw new Error("File type is not allowed");
    }

    return resolvedMimeType;
}
