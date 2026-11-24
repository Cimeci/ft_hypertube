// Télécharge un .torrent pour de vrai, auprès des vrais peers, dans downloads/
// Usage : npm run download:torrent -- <fichier.torrent> [numéro du fichier]
//   sans numéro : tout le torrent ; avec un numéro : seulement ce fichier
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseTorrent } from "../src/lib/bittorrent/torrent/parser.ts";
import { getPeers } from "../src/lib/bittorrent/tracker/getPeers.ts";
import { downloadTorrent } from "../src/lib/bittorrent/client/downloadTorrent.ts";
import { piecesForFile } from "../src/lib/bittorrent/pieces/piece.ts";
import type { Peer } from "../src/lib/bittorrent/tracker/types.ts";
import type { Torrent } from "../src/lib/bittorrent/torrent/types.ts";

const OUTPUT_DIR = "downloads";
const OUR_PORT = 6881;
const PEER_ID_PREFIX = "-HT0001-";
const BYTES_PER_MB = 1024 * 1024;
const MS_PER_SECOND = 1000;

const toMb = (bytes: number): string => (bytes / BYTES_PER_MB).toFixed(1);

const path: string | undefined = process.argv[2];
if (!path) {
    console.error("Usage : npm run download:torrent -- <fichier.torrent> [numéro du fichier]");
    process.exit(1);
}

const fileArg: string | undefined = process.argv[3];
const fileIndex: number | undefined = fileArg === undefined ? undefined : Number(fileArg);

const peerId: Buffer = Buffer.from(PEER_ID_PREFIX + randomBytes(6).toString("hex"));

try {
    const torrent: Torrent = parseTorrent(readFileSync(path));
    console.log(`torrent : ${torrent.name} | taille : ${toMb(torrent.totalLength)} Mo | pièces : ${torrent.pieces.length}`);

    console.log("fichiers :");
    torrent.files.forEach((file, index) => console.log(`  [${index}] ${file.path} (${toMb(file.length)} Mo)`));

    const pieces: number[] | undefined = fileIndex === undefined ? undefined : piecesForFile(torrent, fileIndex);
    if (fileIndex === undefined)
        console.log("à télécharger : tout le torrent (ajoute un numéro de fichier pour n'en prendre qu'un)");
    else
        console.log(`à télécharger : [${fileIndex}] ${torrent.files[fileIndex].path} → ${pieces?.length} pièces`);

    const peers: Peer[] = await getPeers(torrent, peerId, OUR_PORT);
    console.log(`peers trouvés : ${peers.length}`);

    const total: number = pieces?.length ?? torrent.pieces.length;
    let completed: number = 0;
    const started: number = Date.now();

    await downloadTorrent(torrent, peers, OUTPUT_DIR, {
        peerId,
        pieces,
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
