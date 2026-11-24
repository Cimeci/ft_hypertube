import type { Torrent } from "../torrent/types.ts";
import type { Peer } from "../tracker/types.ts";
import type { PeerSession } from "./types.ts";
import { hasPiece } from "../pieces/bitfield.ts";
import { writePiece } from "../storage/writePiece.ts";
import { downloadPiece } from "./downloadPiece.ts";
import { openSession } from "./openSession.ts";

const DEFAULT_MAX_PEERS = 5;

export interface DownloadOptions {
    peerId: Buffer;
    maxPeers?: number;
    sessionTimeoutMs?: number;
    pieceTimeoutMs?: number;
    onPiece?: (index: number) => void;
}

export async function downloadTorrent(
    torrent: Torrent,
    peers: Peer[],
    dir: string,
    options: DownloadOptions,
): Promise<void> {
    const queue: number[] = torrent.pieces.map((_, i) => i);
    const peerQueue: Peer[] = [...peers];
    let done: number = 0;

    const work = async (session: PeerSession): Promise<void> => {
        while (queue.length > 0) {
            const position: number = queue.findIndex((index) => hasPiece(session.bitfield, index));
            if (position === -1) break;

            const [index] = queue.splice(position, 1);

            try {
                const data: Buffer = await downloadPiece(session, torrent, index, options.pieceTimeoutMs);
                await writePiece(dir, torrent, index, data);
                done++;
                options.onPiece?.(index);
            } catch {
                queue.push(index);
                queue.sort((a, b) => a - b);
                break;
            }
        }
        session.socket.destroy();
    };

    const worker = async (): Promise<void> => {
        while(queue.length > 0 && peerQueue.length > 0) {
            const peer: Peer = peerQueue.shift()!;
            let session: PeerSession;
            try {
                session = await openSession(peer, torrent, options.peerId, options.sessionTimeoutMs);
            } catch {
                continue;
            }
            await work(session);
        }
    };

    const workerCount: number = Math.min(options.maxPeers ?? DEFAULT_MAX_PEERS, peers.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    const total: number = torrent.pieces.length;
    const missing: number = total - done;
    if (missing > 0)
        throw new Error(`download incomplete: ${missing} of ${total} pieces missing`);
}
