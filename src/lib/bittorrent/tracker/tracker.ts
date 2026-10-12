import type { TrackerResponse, Peer, AnnounceParams } from "./types.ts";
import { decode } from "../bencode/decoder.ts";
import { getNumber, getBuffer } from "../torrent/parser.ts"

const PEER_LENGTH = 6;
const MS_PER_SECOND = 1000;
const TRACKER_TIMEOUT_MS = 10_000;

function splitPeers(compactPeers: Buffer) : Peer[] {
    if (compactPeers.length % PEER_LENGTH !== 0)
        throw new Error(`tracker: 'peers' length must be a multiple of ${PEER_LENGTH}`);

    const peers: Peer[] = [];

    for (let i = 0; i < compactPeers.length ; i += PEER_LENGTH) {
        const ip = [compactPeers[i], compactPeers[i + 1], compactPeers[i + 2], compactPeers[i + 3]].join(".");
        const port = compactPeers.readUInt16BE(i + 4);
        peers.push({ip, port});
    }
    return peers;
}

function encodeBytes(bytes: Buffer): string {
    const encoded: string[] = [];

    for (const octet of bytes) {
        const hex = octet.toString(16);
        const padded = hex.padStart(2, "0");
        encoded.push(`%${padded}`);
    }
    return encoded.join("")
}

function urlBuilder(params: AnnounceParams): string {
    const query = [
        `info_hash=${encodeBytes(params.infoHash)}`,
        `peer_id=${encodeBytes(params.peerId)}`,
        `port=${params.port}`,
        `uploaded=${params.uploaded}`,
        `downloaded=${params.downloaded}`,
        `left=${params.left}`,
        `compact=1`,
    ].join("&");

    return params.trackerUrl + ( params.trackerUrl.includes("?") ? "&" : "?" ) + query;
}

function parseTrackerResponse(body: Buffer): TrackerResponse {
    const response = decode(body);
    if (!(response instanceof Map))
        throw new Error("tracker: response is not a dictionary");

    if (response.has("failure reason")) {
        const reason = response.get("failure reason");
        if (Buffer.isBuffer(reason))
            throw new Error(`tracker: ${reason.toString()}`);
        throw new Error("tracker: 'failure reason' must be a string");
    }

    const intervalMs = getNumber(response, "interval") * MS_PER_SECOND;
    const peers = splitPeers(getBuffer(response, "peers"));

    return {peers, intervalMs};
}

export async function announce(params: AnnounceParams): Promise<TrackerResponse> {
    const protocol = new URL(params.trackerUrl).protocol;
    if (protocol !== "https:" && protocol !== "http:")
        throw new Error(`tracker: unsupported protocol '${protocol}' (${params.trackerUrl})`);

    const url = urlBuilder(params);
    const res = await fetch(url, { signal: AbortSignal.timeout(TRACKER_TIMEOUT_MS)});
    if (!res.ok)
        throw new Error(`tracker: HTTP ${res.status}`);

    const bytes = await res.arrayBuffer();
    const body = Buffer.from(bytes);
    
    return parseTrackerResponse(body)
}