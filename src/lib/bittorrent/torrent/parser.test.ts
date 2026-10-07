// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseTorrent } from "./parser.ts";

const fixture = (name: string) =>
  readFileSync(new URL(`../__fixtures__/${name}`, import.meta.url));

// Construit un .torrent minimal autour d'un dictionnaire `info` écrit à la main
const ANNOUNCE = "d8:announce30:http://localhost:6969/announce4:info";
const torrentWith = (info: string) => Buffer.from(`${ANNOUNCE}${info}e`, "latin1");
const HASHES = (count: number) => `${count * 20}:${"a".repeat(count * 20)}`;

describe("torrent / un seul fichier (hello.torrent)", () => {
  const torrent = parseTorrent(fixture("hello.torrent"));

  it("lit le tracker", () => {
    assert.deepEqual(torrent.trackers, ["http://localhost:6969/announce"]);
  });

  it("lit le nom", () => {
    assert.equal(torrent.name, "hello.txt");
  });

  it("lit la taille des pieces", () => {
    assert.equal(torrent.pieceLength, 16);
  });

  it("découpe 'pieces' en hash SHA1 de 20 octets", () => {
    assert.equal(torrent.pieces.length, 2);
    assert.equal(torrent.pieces[0].toString("hex"), "68af51b5a5727c89f6779af6a676ecbdd034e6a8");
    assert.equal(torrent.pieces[1].toString("hex"), "c93d958878f48e29765c96917f63d5489072cab1");
  });

  it("présente le fichier unique comme une liste d'un seul fichier", () => {
    assert.deepEqual(torrent.files, [{ path: "hello.txt", length: 18, offset: 0 }]);
  });

  it("calcule la taille totale", () => {
    assert.equal(torrent.totalLength, 18);
  });

  it("calcule l'info_hash (SHA1 des octets exacts du dictionnaire info)", () => {
    assert.ok(Buffer.isBuffer(torrent.infoHash));
    assert.equal(torrent.infoHash.toString("hex"), "f33eee14733f7e663440c14a7261cc6ee7a415ac");
  });
});

describe("torrent / plusieurs fichiers (big-buck-bunny.torrent)", () => {
  const torrent = parseTorrent(fixture("big-buck-bunny.torrent"));

  it("regroupe announce et announce-list sans doublon, announce en premier", () => {
    assert.deepEqual(torrent.trackers, [
      "http://bt1.archive.org:6969/announce",
      "http://bt2.archive.org:6969/announce",
    ]);
  });

  it("lit le nom (le dossier qui contient les fichiers)", () => {
    assert.equal(torrent.name, "BigBuckBunny_124");
  });

  it("lit les 12 fichiers", () => {
    assert.equal(torrent.files.length, 12);
  });

  it("construit le chemin : nom du torrent + segments de 'path'", () => {
    assert.equal(torrent.files[0].path, "BigBuckBunny_124/BigBuckBunny_124_meta.xml");
    assert.equal(torrent.files[8].path, "BigBuckBunny_124/Content/big_buck_bunny_720p_surround.avi");
  });

  it("calcule l'offset de chaque fichier dans le flux d'octets global", () => {
    assert.deepEqual(torrent.files[0], {
      path: "BigBuckBunny_124/BigBuckBunny_124_meta.xml",
      length: 1484,
      offset: 0,
    });
    assert.equal(torrent.files[1].offset, 1484);
    assert.equal(torrent.files[8].offset, 62917);
    assert.equal(torrent.files[8].length, 332243668);
  });

  it("calcule la taille totale (somme des fichiers)", () => {
    assert.equal(torrent.totalLength, 441396841);
  });

  it("a autant de hash que de pieces nécessaires", () => {
    assert.equal(torrent.pieceLength, 524288);
    assert.equal(torrent.pieces.length, 842);
  });

  it("calcule l'info_hash", () => {
    assert.equal(torrent.infoHash.toString("hex"), "8337c196d4536e9af5d2c7e599f0f1b7d71eee54");
  });
});

describe("torrent / structure invalide", () => {
  it("accepte le torrent minimal utilisé par les tests ci-dessous", () => {
    const torrent = parseTorrent(
      torrentWith(`d6:lengthi18e4:name9:hello.txt12:piece lengthi16e6:pieces${HASHES(2)}e`),
    );
    assert.equal(torrent.name, "hello.txt");
  });

  it("rejette une racine qui n'est pas un dictionnaire", () => {
    assert.throws(() => parseTorrent(Buffer.from("i42e")));
  });

  it("rejette un torrent sans dictionnaire 'info'", () => {
    assert.throws(() => parseTorrent(Buffer.from("d8:announce3:urle")));
  });

  it("rejette un champ du mauvais type ('piece length' en string)", () => {
    assert.throws(() =>
      parseTorrent(torrentWith(`d6:lengthi18e4:name9:hello.txt12:piece length2:166:pieces${HASHES(2)}e`)),
    );
  });

  it("rejette une taille de piece nulle ou négative", () => {
    assert.throws(() =>
      parseTorrent(torrentWith(`d6:lengthi18e4:name9:hello.txt12:piece lengthi0e6:pieces${HASHES(2)}e`)),
    );
  });

  it("rejette 'pieces' dont la taille n'est pas un multiple de 20", () => {
    assert.throws(() =>
      parseTorrent(torrentWith("d6:lengthi18e4:name9:hello.txt12:piece lengthi16e6:pieces5:aaaaae")),
    );
  });

  it("rejette un torrent sans 'length' ni 'files'", () => {
    assert.throws(() =>
      parseTorrent(torrentWith(`d4:name9:hello.txt12:piece lengthi16e6:pieces${HASHES(2)}e`)),
    );
  });

  it("rejette un nombre de hash incohérent avec la taille totale", () => {
    // 18 octets en pieces de 16 => il faut 2 hash, on n'en donne qu'un
    assert.throws(() =>
      parseTorrent(torrentWith(`d6:lengthi18e4:name9:hello.txt12:piece lengthi16e6:pieces${HASHES(1)}e`)),
    );
  });
});

describe("torrent / sécurité des chemins (path traversal)", () => {
  const multiFile = (name: string, path: string) =>
    torrentWith(`d5:filesld6:lengthi5e4:pathl${path}eee4:name${name}12:piece lengthi16e6:pieces${HASHES(1)}e`);

  it("accepte un chemin normal", () => {
    const torrent = parseTorrent(multiFile("4:film", "6:videos9:movie.mkv"));
    assert.equal(torrent.files[0].path, "film/videos/movie.mkv");
  });

  it("rejette un segment '..' (écrirait en dehors du dossier de téléchargement)", () => {
    assert.throws(() => parseTorrent(multiFile("4:film", "2:..2:..6:passwd")));
  });

  it("rejette un segment qui contient un '/'", () => {
    assert.throws(() => parseTorrent(multiFile("4:film", "16:../../etc/passwd")));
  });

  it("rejette un segment vide", () => {
    assert.throws(() => parseTorrent(multiFile("4:film", "0:")));
  });

  it("rejette un nom de torrent '..'", () => {
    assert.throws(() => parseTorrent(multiFile("2:..", "9:movie.mkv")));
  });

  it("rejette une liste 'path' vide", () => {
    assert.throws(() =>
      parseTorrent(torrentWith(`d5:filesld6:lengthi5e4:pathleee4:name4:film12:piece lengthi16e6:pieces${HASHES(1)}e`)),
    );
  });
});
