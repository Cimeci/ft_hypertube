import type { Torrent, TorrentFile } from "../torrent/types.ts";
import type { Block } from "./types.ts";
import { createHash } from "node:crypto"

const BLOCK_SIZE = 16384;

export function pieceSize(torrent: Torrent, index: number): number {
    const start = index * torrent.pieceLength;
    const rest = torrent.totalLength - start;

    return Math.min(torrent.pieceLength, rest);
}

export function pieceBlocks(torrent: Torrent, index: number): Block[] {
    const size = pieceSize(torrent, index);
    const block: Block[]  = [];

    for (let begin = 0; begin < size; begin += BLOCK_SIZE) {
        const length = Math.min(BLOCK_SIZE, size - begin );
        block.push({ begin, length });
    }
    return block;
}

export function verifyPiece(torrent: Torrent, index: number, data: Buffer): boolean {
    const hash = createHash("sha1").update(data).digest();
    return hash.equals(torrent.pieces[index]);
}
export function piecesForFile(torrent: Torrent, fileIndex: number): number[] {
    const file: TorrentFile | undefined = torrent.files[fileIndex];
    if (!Number.isInteger(fileIndex) || !file)
        throw new Error(`file ${fileIndex} does not exist`);
    if (file.length === 0)
        return [];

    const firstByte: number = file.offset;
    const lastByte: number = file.offset + file.length - 1;

    const firstPiece: number = Math.floor(firstByte / torrent.pieceLength);
    const lastPiece: number = Math.floor(lastByte / torrent.pieceLength);
    const count: number = lastPiece - firstPiece + 1;

    return Array.from({ length: count }, (_, i) => firstPiece + i);
}
