import { promises as fs } from 'fs';
import path from 'path';

/** Storage size information */
export interface IStorageSize {
    size: number;
    humanReadable: string;
}

/** Detailed storage statistics */
export interface IStorageStats {
    content: IStorageSize;
    libraries: IStorageSize;
    userData: IStorageSize;
    temporaryStorage: IStorageSize;
    total: IStorageSize;
}

/** Content item size information */
export interface IContentItemSize {
    contentId: string;
    size: number;
    humanReadable: string;
}

/** Detailed storage statistics with content breakdown */
export interface IDetailedStorageStats extends IStorageStats {
    contentItems: IContentItemSize[];
}

/**
 * Formats bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Recursively calculates total size of a directory
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                totalSize += await getDirectorySize(entryPath);
            } else if (entry.isFile()) {
                const stats = await fs.stat(entryPath);
                totalSize += stats.size;
            }
        }
    } catch {
        // Directory doesn't exist or is not accessible
        return 0;
    }

    return totalSize;
}

/**
 * Creates storage size object from bytes
 */
function createStorageSize(bytes: number): IStorageSize {
    return {
        size: bytes,
        humanReadable: formatBytes(bytes)
    };
}

/**
 * Gets sizes of individual content items
 */
export async function getContentItemsSizes(contentPath: string): Promise<IContentItemSize[]> {
    const items: IContentItemSize[] = [];

    try {
        const entries = await fs.readdir(contentPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const itemPath = path.join(contentPath, entry.name);
                const size = await getDirectorySize(itemPath);
                items.push({
                    contentId: entry.name,
                    size,
                    humanReadable: formatBytes(size)
                });
            }
        }
    } catch {
        // Content directory doesn't exist
        return [];
    }

    return items.sort((a, b) => b.size - a.size);
}

/**
 * Calculates storage statistics for H5P directories
 */
export async function getStorageStats(basePath: string = 'h5p'): Promise<IStorageStats> {
    const [contentSize, librariesSize, userDataSize, tempSize] = await Promise.all([
        getDirectorySize(path.resolve(basePath, 'content')),
        getDirectorySize(path.resolve(basePath, 'libraries')),
        getDirectorySize(path.resolve(basePath, 'user-data')),
        getDirectorySize(path.resolve(basePath, 'temporary-storage'))
    ]);

    const totalSize = contentSize + librariesSize + userDataSize + tempSize;

    return {
        content: createStorageSize(contentSize),
        libraries: createStorageSize(librariesSize),
        userData: createStorageSize(userDataSize),
        temporaryStorage: createStorageSize(tempSize),
        total: createStorageSize(totalSize)
    };
}

/**
 * Calculates detailed storage statistics including content breakdown
 */
export async function getDetailedStorageStats(basePath: string = 'h5p'): Promise<IDetailedStorageStats> {
    const [stats, contentItems] = await Promise.all([
        getStorageStats(basePath),
        getContentItemsSizes(path.resolve(basePath, 'content'))
    ]);

    return {
        ...stats,
        contentItems
    };
}