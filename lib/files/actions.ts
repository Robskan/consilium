"use server";

import { createFile, createVersion } from "@/lib/files/create";
import semver from "semver";
import {updateFile, updateVersion} from "@/lib/files/update";
import {deleteFile, deleteVersion, restoreFile, restoreVersion} from "@/lib/files/delete";
import mime from "mime-types";

export async function createFileAction(formData: FormData): Promise<void> {
    const name = formData.get("name");
    const description = formData.get("description");
    const version = formData.get("version");
    const notes = formData.get("notes");
    const upload = formData.get("file");
    const requiredRoleIdsRaw = formData.getAll("requiredRoleIds");

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

    const requiredRoleIds = requiredRoleIdsRaw.map(value => {
        const id = Number(value);

        if (!Number.isInteger(id)) {
            throw new Error("Invalid role ID");
        }

        return id;
    });

    if (!(upload instanceof File)) {
        throw new Error("A file is required");
    }

    const mimeType = await validateFile(upload);

    const data = Buffer.from(await upload.arrayBuffer());


    await createFile({
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
}

export async function createVersionAction(formData: FormData): Promise<void> {
    const fileId = Number(formData.get("fileId"));
    const version = formData.get("version");
    const notes = formData.get("notes");
    const upload = formData.get("file");

    if (!Number.isInteger(fileId)) {
        throw new Error("Invalid file ID");
    }

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

    await createVersion({
        fileId,
        version: version.trim(),
        filename: upload.name,
        data,
        notes: typeof notes === "string"
            ? notes.trim()
            : "No release notes",
    })
}

export async function updateFileAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));
    const name = formData.get("name");
    const description = formData.get("description");
    const requiredRoleIdsRaw = formData.getAll("requiredRoleIds");

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    const requiredRoleIds = requiredRoleIdsRaw.map(value => {
        const id = Number(value);

        if (!Number.isInteger(id)) {
            throw new Error("Invalid role ID");
        }

        return id;
    });

    await updateFile({
        id,
        name: typeof name === "string"
            ? name.trim()
            : undefined,
        requiredRoleIds,
        description: typeof description === "string"
            ? description.trim()
            : undefined,
    })
}

export async function updateVersionAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));
    const notes = formData.get("notes");
    const hidden = formData.get("hidden");

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    await updateVersion({
        id,
        notes: typeof notes === "string"
            ? notes.trim()
            : undefined,
        hidden: hidden === "true"
            ? true
            : hidden === "false"
                ? false
                : undefined
    })
}

export async function deleteFileAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    await deleteFile(id)
}

export async function deleteVersionAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    await deleteVersion(id)
}

export async function restoreFileAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    await restoreFile(id)
}

export async function restoreVersionAction(formData: FormData): Promise<void> {
    const id = Number(formData.get("fileId"));

    if (!Number.isInteger(id)) {
        throw new Error("Invalid file ID");
    }

    await restoreVersion(id)
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