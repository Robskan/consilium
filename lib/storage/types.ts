export interface FileStorage {
    save(
        data: Buffer,
        filename: string,
    ): Promise<{
        storageKey: string;
        fileSize: number;
    }>;

    get(storageKey: string): Promise<Buffer>;

    delete(storageKey: string): Promise<void>;
}