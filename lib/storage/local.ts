import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import type { FileStorage } from "./types";

const STORAGE_ROOT = process.env.FILE_STORAGE_PATH ?? "./data/files";

export class LocalFileStorage implements FileStorage {
    async save(
        data: Buffer,
        filename: string,
    ): Promise<{
        storageKey: string;
        fileSize: number;
    }> {
        const id = crypto.randomUUID();

        const extension = path.extname(filename);
        const storageKey = `${id}${extension}`;

        const fullPath = path.join(STORAGE_ROOT, storageKey);

        await mkdir(STORAGE_ROOT, {
            recursive: true,
        });

        await writeFile(fullPath, data);

        return {
            storageKey,
            fileSize: data.length,
        };
    }

    async get(storageKey: string): Promise<Buffer> {
        const fullPath = path.join(STORAGE_ROOT, storageKey);

        return await readFile(fullPath);
    }

    async delete(storageKey: string): Promise<void> {
        const fullPath = path.join(STORAGE_ROOT, storageKey);

        await unlink(fullPath);
    }
}