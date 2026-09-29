export function formatFileSize(bytes: bigint) {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return "Unknown size";
    if (value < 1024) return `${value} B`;

    const units = ["KB", "MB", "GB", "TB"];
    let size = value / 1024;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    }
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
}
