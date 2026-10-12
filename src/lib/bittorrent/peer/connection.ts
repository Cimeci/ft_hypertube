import type { Handshake, PeerConnection } from "./types.ts"
import type { Peer } from "../tracker/types.ts"
import { connect } from "node:net"
import { buildHandshake, parseHandshake, HANDSHAKE_LENGTH } from "./handshake.ts"

const HANDSHAKE_TIMEOUT_MS = 10_000;

export function connectToPeer(peer: Peer, handshake: Handshake): Promise<PeerConnection> {
    return new Promise((resolve, reject) => {
        const socket = connect(peer.port, peer.ip);
        let received= Buffer.alloc(0);

        const onConnect = () => {
            socket.write(buildHandshake(handshake))
        };
        const onData = (chunk: Buffer) => {
            received = Buffer.concat([received, chunk]);
            if (received.length < HANDSHAKE_LENGTH)
                return;
            try {
                const parsed = parseHandshake(received);
                if (!parsed.infoHash.equals(handshake.infoHash))
                    throw new Error(`peer ${peer.ip}:${peer.port}: info hash mismatch`);
            }  catch(err) {
                fail(err as Error);
                return;
            }
            cleanup();
            resolve({socket, leftover: received.subarray(HANDSHAKE_LENGTH)});
        }

        const onTimeout = () => {
            fail(new Error(`peer ${peer.ip}:${peer.port}: handshake timed out`))
        }

        const onError = (err: Error) => {
            fail(err);
        }

        const onClose = () => {
            fail(new Error(`peer ${peer.ip}:${peer.port}: connection closed before handshake`))
        }

        const cleanup = () => {
            socket.off("timeout", onTimeout);
            socket.off("error", onError);
            socket.off("close", onClose);
            socket.off("connect", onConnect);
            socket.off("data", onData);
            socket.setTimeout(0);
        };

        const fail = (err: Error) => {
            cleanup();
            socket.destroy();
            reject(err)
        };

        socket.setTimeout(HANDSHAKE_TIMEOUT_MS);
        socket.on("timeout", onTimeout);
        socket.on("error", onError);
        socket.on("close", onClose);
        socket.on("connect", onConnect);
        socket.on("data", onData);
    });
}