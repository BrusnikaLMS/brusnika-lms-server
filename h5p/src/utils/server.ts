import os from 'os';
import { rm } from 'fs/promises';

/** File object with optional temp path */
interface TempFile {
    tempFilePath?: string;
    [key: string]: unknown;
}

/** Request with optional files for cleanup */
interface RequestWithOptionalFiles {
    files?: { [key: string]: TempFile } | unknown;
}

/**
 * Formats IP address for URL display
 */
function formatIpAddress(address: string, family: string): string {
    const isIPv6 = family === 'IPv6';
    return isIPv6 ? `[${address}]` : address;
}

/**
 * Displays links to the server at all available IP addresses.
 *
 * @param port - The port at which the server can be accessed
 */
export function displayIps(port: string): void {
    console.log('H5P Server is running:');

    const networkInterfaces = os.networkInterfaces();

    for (const devName of Object.keys(networkInterfaces)) {
        const interfaces = networkInterfaces[devName];
        if (!interfaces) continue;

        interfaces
            .filter((iface) => !iface.internal)
            .forEach((iface) => {
                const formattedAddress = formatIpAddress(iface.address, iface.family);
                console.log(`  http://${formattedAddress}:${port}`);
            });
    }
}

/**
 * Deletes all temporary uploaded files from the request.
 *
 * This should be called after request processing to clean up
 * temporary files created during file upload.
 *
 * @param req - Express request with optional files
 */
export async function clearTempFiles(req: RequestWithOptionalFiles): Promise<void> {
    const files = req.files as { [key: string]: TempFile } | undefined;
    if (!files || typeof files !== 'object') {
        return;
    }

    const deletePromises = Object.keys(files).map((fileKey) => {
        const file = files[fileKey];
        const tempPath = file?.tempFilePath;

        if (tempPath && tempPath !== '') {
            return rm(tempPath, { recursive: true, force: true });
        }
        return Promise.resolve();
    });

    await Promise.all(deletePromises);
}