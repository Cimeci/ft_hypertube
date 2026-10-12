import type { Socket } from "node:net"

export interface Handshake {
    infoHash: Buffer;
    peerId: Buffer;
}

export interface PeerConnection {
    socket: Socket;
    leftover: Buffer;
}