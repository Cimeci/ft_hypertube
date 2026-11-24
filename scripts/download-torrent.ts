// Télécharge un .torrent pour de vrai, auprès des vrais peers, dans downloads/
// Usage : npm run download:torrent -- <fichier.torrent>
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseTorrent } from "../src/lib/bittorrent/torrent/parser.ts";
import { getPeers } from "../src/lib/bittorrent/tracker/getPeers.ts";
import { downloadTorrent } from "../src/lib/bittorrent/client/downloadTorrent.ts";
import type { Peer } from "../src/lib/bittorrent/tracker/types.ts";
import type { Torrent } from "../src/lib/bittorrent/torrent/types.ts";

const OUTPUT_DIR = "downloads";
const OUR_PORT = 6881;
const PEER_ID_PREFIX = "-HT0001-";
const BYTES_PER_MB = 1024 * 1024;
const MS_PER_SECOND = 1000;

const path: string | undefined = process.argv[2];
if (!path) {
    console.error("Usage : npm run download:torrent -- <fichier.torrent>");
    process.exit(1);
}

const peerId: Buffer = Buffer.from(PEER_ID_PREFIX + randomBytes(6).toString("hex"));

try {
    const torrent: Torrent = parseTorrent(readFileSync(path));
    console.log(`torrent : ${torrent.name} | taille : ${(torrent.totalLength / BYTES_PER_MB).toFixed(1)} Mo | pièces : ${torrent.pieces.length}`);

    const peers: Peer[] = await getPeers(torrent, peerId, OUR_PORT);
    console.log(`peers trouvés : ${peers.length}`);

    const total: number = torrent.pieces.length;
    let completed: number = 0;
    const started: number = Date.now();

    await downloadTorrent(torrent, peers, OUTPUT_DIR, {
        peerId,
        onPiece: (index) => {
            completed++;
            console.log(`pièce ${index} ok (${completed}/${total}, ${((completed / total) * 100).toFixed(1)} %)`);
        },
    });

    const elapsedMs: number = Date.now() - started;
    console.log(`terminé en ${(elapsedMs / MS_PER_SECOND).toFixed(1)} s → ${OUTPUT_DIR}/`);
} catch (err) {
    console.error(`échec : ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
}
