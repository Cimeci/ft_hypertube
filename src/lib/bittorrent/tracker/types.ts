export interface Peer {
    ip: string;
    port: number;
}

export interface TrackerResponse {
    peers : Peer[];
    intervalMs: number;
}

export interface AnnounceParams {
    trackerUrl: string;
    infoHash: Buffer;
    peerId: Buffer;
    port: number;
    uploaded: number;
    downloaded: number;
    left: number;
}