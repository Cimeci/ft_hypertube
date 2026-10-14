import type { Message } from "./types.ts";

const LENGTH_PREFIX = 4;
const HAVE_LENGTH = 5;
const PIECE_HEADER_LENGTH = 9;

const CHOKE = 0;
const UNCHOKE = 1;
const INTERESTED = 2;
const NOT_INTERESTED = 3;
const HAVE = 4;
const BITFIELD = 5;
const REQUEST = 6;
const PIECE = 7;

const BEGIN_POSITION = 4;
const LENGTH_POSITION = 8;
const REQUEST_PAYLOAD_LENGTH = 12;


export function splitMessages(data: Buffer): { messages: Buffer[]; rest: Buffer } {
    let offset = 0;
    const messages: Buffer[] = [];

    while (data.length - offset >= LENGTH_PREFIX) {
        const messageLength = data.readUInt32BE(offset)
        if (data.length - offset < LENGTH_PREFIX + messageLength)
            break;
        messages.push(data.subarray(offset + LENGTH_PREFIX, offset + LENGTH_PREFIX + messageLength));
        offset += LENGTH_PREFIX + messageLength;
    }
    return { messages, rest: data.subarray(offset) };
}

export function parseMessage(message: Buffer): Message {
    if (message.length === 0)
        return { type: "keep-alive" }
    const id = message[0];

    switch(id) {
        case CHOKE: return { type: "choke" };
        case UNCHOKE: return { type: "unchoke" };
        case INTERESTED: return { type: "interested" };
        case NOT_INTERESTED: return { type: "not-interested" };
        case HAVE: {
            if (message.length !== HAVE_LENGTH)
                throw new Error("peer: 'have' message must be 5 bytes");
            const index = message.readUInt32BE(1);
            return { type: "have", index };
        }
        case BITFIELD: return { type: "bitfield", bitfield: message.subarray(1) }
        case PIECE: {
            if (message.length < PIECE_HEADER_LENGTH)
                throw new Error("peer: 'piece' message too short");
            const index = message.readUInt32BE(1);
            const begin = message.readUInt32BE(5);
            const block = message.subarray(9);
            return { type: "piece", index, begin, block };
        }
        default: return { type: "unknown", id };
    }
}

function buildMessage(id: number, payload: Buffer): Buffer {
    const length = Buffer.alloc(LENGTH_PREFIX);
    length.writeUInt32BE(1 + payload.length, 0);
    return Buffer.concat([length, Buffer.from([id]), payload]);
}
export function buildInterested(): Buffer {
    return buildMessage(INTERESTED, Buffer.alloc(0));

}

export function buildRequest(index: number, begin: number, length: number): Buffer {
    const payload = Buffer.alloc(REQUEST_PAYLOAD_LENGTH);
    payload.writeUInt32BE(index, 0);
    payload.writeUInt32BE(begin, BEGIN_POSITION);
    payload.writeUInt32BE(length, LENGTH_POSITION);
    return buildMessage(REQUEST, payload);
}