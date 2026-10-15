import type { Socket } from "node:net"
import type { Peer } from "../tracker/types.ts"

export interface PeerSession {
    socket: Socket;
    pending: Buffer;
    bitfield: Buffer;
    choked: boolean;
    peer: Peer;
}
