import type { Message } from "../peer/types.ts";
import type { PeerSession } from "./types.ts";
import { setPiece } from "../pieces/bitfield.ts";

export function applyMessage(session: PeerSession, message: Message): void {
    switch (message.type) {
        case "choke": {
            session.choked = true;
            break;
        }
        case "unchoke": {
            session.choked = false;
            break;
        }
        case "have": {
            setPiece(session.bitfield, message.index);
            break;
        }
        case "bitfield": {
            if (message.bitfield.length !== session.bitfield.length)
                throw new Error(`peer ${session.peer.ip}:${session.peer.port}: bitfield has wrong length`);
            session.bitfield = message.bitfield;
            break;
        }
    }
}