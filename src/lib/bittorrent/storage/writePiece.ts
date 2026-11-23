import type { Torrent } from "../torrent/types.ts";
import { type FileHandle, mkdir, open } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { pieceSize } from "../pieces/piece.ts";

export async function writePiece(dir: string, torrent: Torrent, index: number, data: Buffer): Promise<void> {
    if (!Number.isInteger(index) || index < 0 || index >= torrent.pieces.length)
        throw new Error(`piece ${index} does not exist`);

    if (data.length !== pieceSize(torrent, index))
        throw new Error(`piece ${index} has wrong size`);

    const start: number = index * torrent.pieceLength;
    const end: number = start + data.length;

    for (const file of torrent.files) {
        const overlapStart: number = Math.max(start, file.offset);
        const overlapEnd: number = Math.min(end, file.offset + file.length);

        if (overlapStart >= overlapEnd)
            continue;

        const path: string = join(dir, file.path);
        await mkdir(dirname(path), { recursive: true });

        const handle: FileHandle = await open(path, constants.O_RDWR | constants.O_CREAT);

        try {
            await handle.write(data, overlapStart - start, overlapEnd - overlapStart, overlapStart - file.offset);
        } finally {
            await handle.close();
        }
    }
}
