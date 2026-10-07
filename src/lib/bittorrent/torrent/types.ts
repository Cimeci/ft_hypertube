export interface TorrentFile {
    path: string;
    length: number;
    offset: number;  // position du fichier dans le flux global
}

export interface Torrent {
    trackers: string[];   // announce + announce-list, sans doublon, announce en premier
    name: string;
    pieceLength: number;
    pieces: Buffer[];     // un Buffer de 20 octets par piece
    files: TorrentFile[]; // toujours une liste, même pour un torrent à un seul fichier
    totalLength: number;
    infoHash: Buffer;     // 20 octets
}