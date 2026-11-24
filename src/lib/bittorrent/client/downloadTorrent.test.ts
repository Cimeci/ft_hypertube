// Lancer : npm run test:bt
// Ce fichier seul : node --test src/lib/bittorrent/client/downloadTorrent.test.ts
//
// On teste downloadTorrent contre plusieurs faux peers locaux (voir testing/fakePeer.ts),
// et on vérifie le fichier écrit sur le disque dans un dossier temporaire.
import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Torrent } from "../torrent/types.ts";
import { deadPeer, startFakePeer, type FakePeer, type FakePeerOptions } from "../testing/fakePeer.ts";
import { downloadTorrent, type DownloadOptions } from "./downloadTorrent.ts";

const sha1 = (data: Buffer): Buffer => createHash("sha1").update(data).digest();

// Un "film" de 72 octets, pièces de 16 → 5 pièces : 16 + 16 + 16 + 16 + 8
const MOVIE_DATA: Buffer = Buffer.from("0123456789abcdef".repeat(4) + "THE END!");
const PIECE_LENGTH = 16;
const ALL: number[] = [0, 1, 2, 3, 4];
const MOVIE: Torrent = {
  trackers: [],
  name: "movie.bin",
  pieceLength: PIECE_LENGTH,
  pieces: ALL.map((i) => sha1(MOVIE_DATA.subarray(i * PIECE_LENGTH, (i + 1) * PIECE_LENGTH))),
  files: [{ path: "movie.bin", length: MOVIE_DATA.length, offset: 0 }],
  totalLength: MOVIE_DATA.length,
  infoHash: sha1(Buffer.from("movie")),
};

let dir: string;
let fakes: FakePeer[] = [];

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "bt-download-"));
});

afterEach(async () => {
  await Promise.all(fakes.map((fake) => fake.stop()));
  fakes = [];
  await rm(dir, { recursive: true, force: true });
});

const fake = async (has: number[], behavior: FakePeerOptions["behavior"] = "good"): Promise<FakePeer> => {
  const started = await startFakePeer({ torrent: MOVIE, data: MOVIE_DATA, has, behavior });
  fakes.push(started);
  return started;
};

// Dans les tests on n'attend jamais les vrais timeouts (5 s et 30 s)
const options = (overrides: Partial<DownloadOptions> = {}): DownloadOptions => ({
  peerId: Buffer.from("-HT0001-123456789012"),
  sessionTimeoutMs: 300,
  pieceTimeoutMs: 300,
  ...overrides,
});
const LIMIT = { timeout: 5000 };

const movieOnDisk = (): Promise<Buffer> => readFile(join(dir, "movie.bin"));

// =================================================================================

describe("downloadTorrent / un seul peer", () => {
  it("un bon peer qui a tout : le fichier sur le disque est le film complet", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options());
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("onPiece est appelé une fois par pièce", LIMIT, async () => {
    const good = await fake(ALL);
    const done: number[] = [];
    await downloadTorrent(MOVIE, [good.peer], dir, options({ onPiece: (index) => done.push(index) }));
    assert.deepEqual([...done].sort(), ALL);
  });

  it("demande les pièces dans l'ordre 0, 1, 2… (le début du film d'abord, pour le streaming)", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options());
    assert.deepEqual(good.requestedPieces, ALL);
  });
});

describe("downloadTorrent / plusieurs peers", () => {
  it("deux peers qui ont chacun une moitié : le film est complet", LIMIT, async () => {
    const first = await fake([0, 1, 2]);
    const second = await fake([3, 4]);
    await downloadTorrent(MOVIE, [first.peer, second.peer], dir, options());
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("ne demande à un peer que les pièces qu'il possède", LIMIT, async () => {
    const first = await fake([0, 1, 2]);
    const second = await fake([3, 4]);
    await downloadTorrent(MOVIE, [first.peer, second.peer], dir, options());
    assert.ok(first.requestedPieces.every((index) => [0, 1, 2].includes(index)));
    assert.ok(second.requestedPieces.every((index) => [3, 4].includes(index)));
  });

  it("chaque pièce n'est téléchargée qu'une fois quand tout se passe bien", LIMIT, async () => {
    const first = await fake(ALL);
    const second = await fake(ALL);
    await downloadTorrent(MOVIE, [first.peer, second.peer], dir, options());
    const all = [...first.requestedPieces, ...second.requestedPieces].sort();
    assert.deepEqual(all, ALL);
  });

  it("maxPeers: 1 → ne se connecte qu'à un seul peer à la fois", LIMIT, async () => {
    const first = await fake(ALL);
    const second = await fake(ALL);
    await downloadTorrent(MOVIE, [first.peer, second.peer], dir, options({ maxPeers: 1 }));
    assert.equal(first.connections, 1);
    assert.equal(second.connections, 0);
  });
});

describe("downloadTorrent / les peers qui posent problème", () => {
  it("un peer injoignable en premier : passe au suivant", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [await deadPeer(), good.peer], dir, options({ maxPeers: 1 }));
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("un peer qui envoie des blocs faux : ses pièces sont reprises par un autre", LIMIT, async () => {
    const corrupt = await fake(ALL, "corrupt");
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [corrupt.peer, good.peer], dir, options());
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("une pièce ratée est reprise en premier, pas à la fin (le début du film d'abord)", LIMIT, async () => {
    const corrupt = await fake(ALL, "corrupt");
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [corrupt.peer, good.peer], dir, options({ maxPeers: 1 }));
    assert.deepEqual(corrupt.requestedPieces, [0]);
    assert.deepEqual(good.requestedPieces, ALL);
  });

  it("un peer qui coupe la connexion : sa pièce est reprise par un autre", LIMIT, async () => {
    const closing = await fake(ALL, "close-on-request");
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [closing.peer, good.peer], dir, options());
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("un peer qui ne répond plus : timeout, puis reprise par un autre", LIMIT, async () => {
    const silent = await fake(ALL, "silent");
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [silent.peer, good.peer], dir, options({ maxPeers: 1 }));
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });

  it("un peer sans aucune pièce (pas de bitfield) : ignoré", LIMIT, async () => {
    const empty = await fake([]);
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [empty.peer, good.peer], dir, options({ maxPeers: 1 }));
    assert.deepEqual(await movieOnDisk(), MOVIE_DATA);
  });
});

describe("downloadTorrent / les échecs", () => {
  it("aucun peer : rejette, les 5 pièces manquent", LIMIT, async () => {
    await assert.rejects(downloadTorrent(MOVIE, [], dir, options()), /download incomplete: 5 of 5 pieces missing/);
  });

  it("que des peers en panne : rejette", LIMIT, async () => {
    const corrupt = await fake(ALL, "corrupt");
    await assert.rejects(
      downloadTorrent(MOVIE, [corrupt.peer, await deadPeer()], dir, options()),
      /download incomplete: 5 of 5 pieces missing/,
    );
  });

  it("personne n'a la pièce 4 : rejette, mais les pièces 0 à 3 sont bien sur le disque", LIMIT, async () => {
    const partial = await fake([0, 1, 2, 3]);
    await assert.rejects(
      downloadTorrent(MOVIE, [partial.peer], dir, options()),
      /download incomplete: 1 of 5 pieces missing/,
    );
    assert.equal(existsSync(join(dir, "movie.bin")), true);
    assert.deepEqual((await movieOnDisk()).subarray(0, 64), MOVIE_DATA.subarray(0, 64));
  });
});

describe("downloadTorrent / option pieces (seulement certaines pièces)", () => {
  it("pieces: [1, 2] → ne demande que ces deux pièces, et elles sont bien sur le disque", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [1, 2] }));
    assert.deepEqual(good.requestedPieces, [1, 2]);
    assert.deepEqual((await movieOnDisk()).subarray(16, 48), MOVIE_DATA.subarray(16, 48));
  });

  it("pièces données dans le désordre : téléchargées quand même dans l'ordre", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [3, 1] }));
    assert.deepEqual(good.requestedPieces, [1, 3]);
  });

  it("une pièce en double : téléchargée une seule fois", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [1, 1] }));
    assert.deepEqual(good.requestedPieces, [1]);
  });

  it("ne modifie pas le tableau pieces qu'on lui donne", LIMIT, async () => {
    const good = await fake(ALL);
    const wanted: number[] = [3, 1];
    await downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: wanted }));
    assert.deepEqual(wanted, [3, 1]);
  });

  it("pieces: [] → rien à faire : se termine sans se connecter à personne", LIMIT, async () => {
    const good = await fake(ALL);
    await downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [] }));
    assert.equal(good.connections, 0);
  });

  it("le bilan ne compte que les pièces demandées : 1 of 2 pieces missing", LIMIT, async () => {
    const partial = await fake([0, 1, 2, 3]);
    await assert.rejects(
      downloadTorrent(MOVIE, [partial.peer], dir, options({ pieces: [3, 4] })),
      /download incomplete: 1 of 2 pieces missing/,
    );
  });

  it("une pièce qui n'existe pas dans le torrent : rejette sans se connecter", LIMIT, async () => {
    const good = await fake(ALL);
    await assert.rejects(downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [1, 5] })), /piece 5 does not exist/);
    await assert.rejects(downloadTorrent(MOVIE, [good.peer], dir, options({ pieces: [-1] })), /piece -1 does not exist/);
    assert.equal(good.connections, 0);
  });
});
