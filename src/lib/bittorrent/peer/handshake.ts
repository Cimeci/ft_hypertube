import type { Handshake } from "./types.ts";

const PROTOCOL = "BitTorrent protocol"
const HANDSHAKE_LENGTH = 68
const RESERVED_LENGTH = 8
const INFO_HASH_OFFSET = 1 + PROTOCOL.length + RESERVED_LENGTH
const INFO_HASH_LENGTH = 20
const PEER_ID_OFFSET = INFO_HASH_OFFSET + INFO_HASH_LENGTH

export function buildHandshake(handshake : Handshake) : Buffer{
    return Buffer.concat([ 
        Buffer.from([PROTOCOL.length]),
        Buffer.from(PROTOCOL),
        Buffer.alloc(RESERVED_LENGTH),
        handshake.infoHash,
        handshake.peerId
    ]);
}

export function parseHandshake(data: Buffer): Handshake {
    if (data.length < HANDSHAKE_LENGTH)
        throw new Error("peer: handshake too short")

    if (data[0] !== PROTOCOL.length || !data.subarray(1, 1 + PROTOCOL.length).equals(Buffer.from(PROTOCOL)))
        throw new Error("peer: not a BitTorrent handshake")

    const infoHash = data.subarray(INFO_HASH_OFFSET, INFO_HASH_OFFSET + INFO_HASH_LENGTH);
    const peerId = data.subarray(PEER_ID_OFFSET , HANDSHAKE_LENGTH);

    return { infoHash, peerId }
}