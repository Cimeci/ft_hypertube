import type { Torrent, TorrentFile } from './types'
import type { BencodeValue } from '../bencode/types.ts'
import { decodeWithRawValues } from '../bencode/decoder.ts'
import { createHash } from 'node:crypto'; 

const SHA1_LENGTH = 20;

export function getNumber(dict: Map<string, BencodeValue>, key: string): number {
    const value = dict.get(key);
    if (typeof value !== "number")
        throw new Error(`torrent: '${key}' must be a number`)
    return value
}

function getString(dict: Map<string, BencodeValue>, key: string): string {
    const value = dict.get(key);
    if (!Buffer.isBuffer(value))
        throw new Error(`torrent: '${key}' must be a string`)
    return value.toString()
}

export function getBuffer(dict: Map<string, BencodeValue>, key: string): Buffer {
    const value = dict.get(key);
    if (!Buffer.isBuffer(value))
        throw new Error(`torrent: '${key}' must be a buffer`)
    return value
}

function getList(dict: Map<string, BencodeValue>, key: string): BencodeValue[] {
    const value = dict.get(key);
    if (!Array.isArray(value))
        throw new Error(`torrent: '${key}' must be a list`)
    return value
}

function checkPathSegment(segment: string): string {
    if (segment === "" || segment === "." || segment === "..")
        throw new Error(`torrent: unsafe path segment '${segment}'`);
    if (segment.includes("/") || segment.includes("\\"))
        throw new Error(`torrent: path segment must not contain a separator: '${segment}'`);
    return segment;
}

function parseTrackers(root: Map<string, BencodeValue>): string[] {
    const trackers: string[] = [];

    if (root.has("announce")){
        trackers.push(getString(root, "announce"));
    }
    
    if (root.has("announce-list")){
        const announceList = getList(root, "announce-list");
        for (const level of announceList){
            if (!Array.isArray(level))
                throw new Error("torrent: each tier of 'announce-list' must be a list");
            for (const url of level) {
                if (!Buffer.isBuffer(url))
                    throw new Error("torrent: each tracker URL must be a string");
                const urlString = url.toString();
                if (!trackers.includes(urlString))
                    trackers.push(urlString);
            }
        }
    }
    return trackers;
}

export function parseTorrent(data: Buffer): Torrent {
    const { value: root, rawValues}  = decodeWithRawValues(data);

    if (!(root instanceof Map))
        throw new Error("torrent: root is not a dictionary")

    const info = root.get("info")
    if (!(info instanceof Map))
        throw new Error("torrent: missing or invalid 'info' dictionary")

    const pieceLength = getNumber(info, "piece length");
    if (pieceLength <= 0)
        throw new Error("torrent: 'piece length' must be greater than zero")

    const name = checkPathSegment(getString(info, "name"));

    const piecesHashes = getBuffer(info, "pieces");
    const piecesLen = piecesHashes.length;
    if (piecesLen % SHA1_LENGTH !== 0 )
        throw new Error(`torrent: 'pieces' length must be a multiple of ${SHA1_LENGTH}`);

    const piecesList: Buffer[] = [];
    for (let i = 0; i < piecesLen; i += SHA1_LENGTH){
        piecesList.push(piecesHashes.subarray(i, i + SHA1_LENGTH))
    }

    const files: TorrentFile[] = [];
    let offset = 0;

    if (info.has("length")){
        const fileLength = getNumber(info, "length");
        files.push({path: name,length: fileLength, offset: offset})
        offset += fileLength;
    } else if (info.has("files")) {
        const fileEntries = getList(info, "files");
        for (const entry of fileEntries ){
            if (!(entry instanceof Map))
                throw new Error("torrent: each item of 'files' must be a dictionary");
            const fileLength = getNumber(entry, "length");
            const pathParts = getList(entry, "path");
            if (pathParts.length === 0)
                throw new Error("torrent: 'path' of a file must not be empty");
            let path: string = name;
            for (const pathPart of pathParts){
                if (!Buffer.isBuffer(pathPart))
                    throw new Error("torrent: each item of 'path' must be a string");
                path += "/" + checkPathSegment(pathPart.toString());
            }
            files.push({path: path, length: fileLength, offset: offset});
            offset += fileLength;
        }
    } else {
        throw new Error("torrent: missing 'length' or 'files'")
    }

    if (piecesList.length !== Math.ceil(offset / pieceLength))
        throw new Error("torrent: number of piece hashes does not match total length");

    const rawInfo = getBuffer(rawValues, "info")
    const infoHash = createHash("sha1").update(rawInfo).digest();

    return { trackers: parseTrackers(root), name, pieceLength, pieces: piecesList, files, totalLength: offset, infoHash: infoHash };
}