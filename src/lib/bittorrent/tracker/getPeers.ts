import type { Torrent } from "../torrent/types.ts";
import type { Peer } from "./types.ts";
import { announce } from "./tracker.ts";

export async function getPeers(torrent: Torrent, peerId: Buffer, port: number): Promise<Peer[]> {
    const results = await Promise.allSettled(
        torrent.trackers.map((trackerUrl) => announce({
            trackerUrl,
            infoHash: torrent.infoHash,
            peerId,
            port,
            uploaded: 0,
            downloaded: 0,
            left: torrent.totalLength,
        })),
    );

    const peers = new Map<string, Peer>();
    let answered: number = 0;

    for (const result of results) {
        if (result.status === "rejected")
            continue;
        answered++;
        result.value.peers.forEach(peer => peers.set(`${peer.ip}:${peer.port}`, peer));
    }
    
    if (answered === 0)
        throw new Error(`tracker: no tracker answered (${torrent.trackers.length} tried)`);
    return [...peers.values()];
}
