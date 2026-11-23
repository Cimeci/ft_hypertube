import type { PeerSession } from "./types.ts";
import type { Torrent } from "../torrent/types.ts";
import { parseMessage, splitMessages, buildInterested, buildRequest } from "../peer/messages.ts";
import { pieceBlocks, verifyPiece } from "../pieces/piece.ts";
import { applyMessage } from "./session.ts";

const PIECE_TIMEOUT_MS = 30_000;

export function downloadPiece(
    session: PeerSession,
    torrent: Torrent,
    index: number,
    timeoutMs = PIECE_TIMEOUT_MS,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const { socket, peer } = session;
        const where: string = `peer ${peer.ip}:${peer.port}:`;
        const blocks = new Map<number, Buffer>();
        const plan = pieceBlocks(torrent, index);
        let requested: boolean = false;

        socket.write(buildInterested());

        const onData = (chunk: Buffer) => {
            try {
                const data = Buffer.concat([session.pending, chunk]);
                const { messages, rest } = splitMessages(data);
                session.pending = rest;

                // Complete messages only; the rest waits for the next chunk
                for (const message of messages) {
                    const parsed = parseMessage(message);
                    applyMessage(session, parsed);
                    if (parsed.type === "choke" && requested) {
                        fail(new Error(`${where} choked during piece ${index}`));
                        return;
                    }
                    if (parsed.type === "piece" && parsed.index === index)
                        blocks.set(parsed.begin, parsed.block);
                }
                // Request once, as soon as the peer unchokes us
                if (!session.choked && !requested) {
                    for (const block of plan) {
                        socket.write(buildRequest(index, block.begin, block.length));
                    }
                    requested = true;
                }
                // Piece complete: join in plan order (blocks may arrive out of order)
                if (plan.every((block) => blocks.has(block.begin))) {
                    const piece = Buffer.concat(plan.map((block) => blocks.get(block.begin)!));
                    if (!verifyPiece(torrent, index, piece)) {
                        fail(new Error(`${where} piece ${index} failed hash check`));
                        return;
                    }

                    cleanup();
                    resolve(piece);
                }
            } catch (err) {
                fail(err as Error);
            }
        };

        const onTimeout = () => { fail(new Error(`${where} timed out during piece ${index}`)) };
        const onError = (err: Error) => { fail(new Error(`${where} ${err.message}`)) };
        const onClose = () => { fail(new Error(`${where} connection closed during piece ${index}`)) };

        const cleanup = () => {
            socket.off("timeout", onTimeout);
            socket.off("error", onError);
            socket.off("close", onClose);
            socket.off("data", onData);
            socket.setTimeout(0);
        };

        const fail = (err: Error) => {
            cleanup();
            socket.destroy();
            reject(err)
        };

        socket.setTimeout(timeoutMs);
        socket.on("timeout", onTimeout);
        socket.on("error", onError);
        socket.on("close", onClose);
        socket.on("data", onData);

        onData(Buffer.alloc(0));
    });
}