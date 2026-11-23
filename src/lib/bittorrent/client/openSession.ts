import type { PeerSession } from "./types.ts";
import type { Torrent } from "../torrent/types.ts";
import type { Peer } from "../tracker/types.ts";
import { connectToPeer } from "../peer/connection.ts";
import { parseMessage, splitMessages } from "../peer/messages.ts";
import { applyMessage } from "./session.ts";

const BITFIELD_TIMEOUT_MS = 5_000;

export async function openSession(
    peer: Peer,
    torrent: Torrent,
    peerId: Buffer,
    timeoutMs = BITFIELD_TIMEOUT_MS,
): Promise<PeerSession> {
    const { socket, leftover } = await connectToPeer(peer, { infoHash: torrent.infoHash, peerId });

    const session: PeerSession = {
        socket: socket,
        pending: leftover,
        bitfield: Buffer.alloc(Math.ceil(torrent.pieces.length / 8)),
        choked: true,
        peer: peer
    };

    return new Promise((resolve, reject) => {
        const where: string = `peer ${peer.ip}:${peer.port}:`;
        let bitfieldSeen: boolean = false;

        const onData = (chunk: Buffer) => {
            try {
                const data = Buffer.concat([session.pending, chunk]);
                const { messages, rest } = splitMessages(data);
                session.pending = rest;

                for (const message of messages) {
                    const parsed = parseMessage(message);
                    applyMessage(session, parsed);
                    if (parsed.type === "bitfield" || parsed.type === "have")
                        bitfieldSeen = true;
                }

                if (bitfieldSeen) {
                    cleanup();
                    resolve(session);
                }
            } catch (err) {
                fail(err as Error);
            }
        };

        const onTimeout = () => { fail(new Error(`${where} no bitfield received`)) };
        const onError   = (err: Error) => { fail(new Error(`${where} ${err.message}`)) };
        const onClose   = () => { fail(new Error(`${where} connection closed before bitfield`)) };

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

        // TODO 4 : dans onData
        //   - lire les messages complets comme dans downloadPiece, applyMessage sur chacun
        //   - retenir si on a vu un message "bitfield" ou "have"
        //   - après la boucle : si oui → cleanup() puis resolve(session)
        //     (NE PAS fermer le socket : downloadPiece va s'en servir)

        // TODO 5 : les messages d'erreur exacts (les tests les vérifient)
        //   timeout → `${where} no bitfield received`
        //   error   → `${where} ${err.message}`
        //   close   → `${where} connection closed before bitfield`
    });
}
