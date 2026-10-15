export interface TorrentFile {
    path: string;
    length: number;
    offset: number;
}

export interface Torrent {
    trackers: string[];
    name: string;
    pieceLength: number;
    pieces: Buffer[];
    files: TorrentFile[];
    totalLength: number;
    infoHash: Buffer;
}