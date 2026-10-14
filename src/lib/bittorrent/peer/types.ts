import type { Socket } from "node:net"

export interface Handshake {
    infoHash: Buffer;
    peerId: Buffer;
}

export interface PeerConnection {
    socket: Socket;
    leftover: Buffer;
}

export type Message = 
    | { type: "keep-alive" }
    | { type: "choke" }
    | { type: "unchoke" }
    | { type: "interested" }
    | { type: "not-interested" }
    | { type: "have"; index: number }
    | { type: "bitfield"; bitfield: Buffer }
    | { type: "piece"; index: number; begin: number; block: Buffer }
    | { type: "unknown"; id: number };