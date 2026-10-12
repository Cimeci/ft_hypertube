// Lancer : npm run test:bt
// Seul `announce` est exporté : on le teste contre un faux tracker HTTP local,
// dont on choisit la réponse et dont on inspecte la requête reçue.
import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { announce } from "./tracker.ts";

const INFO_HASH = Buffer.from("8337c196d4536e9af5d2c7e599f0f1b7d71eee54", "hex"); // Big Buck Bunny
const PEER_ID = Buffer.from("-HT0001-123456789012");

let server: Server;
let baseUrl = "";
let nextStatus = 200;
let nextBody: Buffer = Buffer.alloc(0);
let requestUrl = "";
let requestCount = 0;

before(async () => {
  server = createServer((req, res) => {
    requestUrl = req.url ?? "";
    requestCount++;
    res.statusCode = nextStatus;
    res.end(nextBody);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

beforeEach(() => {
  nextStatus = 200;
  nextBody = Buffer.from("d8:intervali60e5:peers0:e");
  requestUrl = "";
  requestCount = 0;
});

const announceTo = (path = "/announce", overrides = {}) =>
  announce({
    trackerUrl: `${baseUrl}${path}`,
    infoHash: INFO_HASH,
    peerId: PEER_ID,
    port: 6881,
    uploaded: 0,
    downloaded: 0,
    left: 441396841,
    ...overrides,
  });

// Une réponse de tracker valide, avec des peers au format compact (en hexadécimal)
const replyWithPeers = (hex: string, interval = 60) => {
  const peers = Buffer.from(hex, "hex");
  nextBody = Buffer.concat([
    Buffer.from(`d8:intervali${interval}e5:peers${peers.length}:`),
    peers,
    Buffer.from("e"),
  ]);
};

const queryOf = (url: string) => url.slice(url.indexOf("?") + 1);

describe("tracker / la requête envoyée", () => {
  it("contient les paramètres de la spec, dans l'ordre", async () => {
    await announceTo();
    const names = queryOf(requestUrl).split("&").map((part) => part.split("=")[0]);
    assert.deepEqual(names, ["info_hash", "peer_id", "port", "uploaded", "downloaded", "left", "compact"]);
  });

  it("encode info_hash octet par octet en %XX", async () => {
    await announceTo();
    assert.ok(requestUrl.includes("info_hash=%83%37%c1%96%d4%53%6e%9a%f5%d2%c7%e5%99%f0%f1%b7%d7%1e%ee%54&"));
  });

  it("encode aussi peer_id, y compris les octets qui sont des lettres", async () => {
    await announceTo();
    // "-HT0" → 2d 48 54 30
    assert.ok(requestUrl.includes("peer_id=%2d%48%54%30"));
  });

  it("complète à 2 chiffres les octets inférieurs à 16", async () => {
    await announceTo("/announce", { peerId: Buffer.from([0, 1, 15, 16]) });
    assert.ok(requestUrl.includes("peer_id=%00%01%0f%10&"));
  });

  it("écrit les nombres tels quels et demande le format compact", async () => {
    await announceTo();
    assert.ok(requestUrl.endsWith("&port=6881&uploaded=0&downloaded=0&left=441396841&compact=1"));
  });

  it("utilise '&' quand l'adresse du tracker contient déjà un '?'", async () => {
    await announceTo("/announce?passkey=abc123");
    assert.ok(requestUrl.startsWith("/announce?passkey=abc123&info_hash=%83"));
    assert.equal(requestUrl.split("?").length, 2);
  });
});

describe("tracker / la réponse reçue", () => {
  it("lit la vraie réponse du tracker de Big Buck Bunny", async () => {
    // Enregistrée le 2026-10-12 : 12 peers, interval 1896 s
    nextBody = readFileSync(new URL("../__fixtures__/tracker-response.bin", import.meta.url));
    const response = await announceTo();
    assert.equal(response.intervalMs, 1896 * 1000);
    assert.equal(response.peers.length, 12);
    for (const peer of response.peers) {
      assert.match(peer.ip, /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      assert.ok(peer.port >= 0 && peer.port <= 65535);
    }
  });

  it("convertit l'intervalle en millisecondes et découpe les peers (4 octets d'IP + 2 de port)", async () => {
    replyWithPeers("175ad2151ae1" + "0a0000011f90", 1975);
    assert.deepEqual(await announceTo(), {
      intervalMs: 1975000,
      peers: [
        { ip: "23.90.210.21", port: 6881 },
        { ip: "10.0.0.1", port: 8080 },
      ],
    });
  });

  it("ne s'arrête pas sur un octet qui vaut 0", async () => {
    replyWithPeers("000000050050" + "0a0000011f90");
    const { peers } = await announceTo();
    assert.deepEqual(peers, [
      { ip: "0.0.0.5", port: 80 },
      { ip: "10.0.0.1", port: 8080 },
    ]);
  });

  it("lit les ports extrêmes en big-endian", async () => {
    replyWithPeers("7f000001" + "0001" + "7f000001" + "ffff");
    const { peers } = await announceTo();
    assert.deepEqual(peers.map((peer) => peer.port), [1, 65535]);
  });

  it("accepte une liste de peers vide", async () => {
    assert.deepEqual(await announceTo(), { intervalMs: 60000, peers: [] });
  });
});

describe("tracker / les erreurs", () => {
  it("relaie le message d'erreur envoyé par le tracker, avant de chercher 'interval'", async () => {
    nextBody = Buffer.from("d14:failure reason28:requested download not founde");
    await assert.rejects(announceTo(), /tracker: requested download not found/);
  });

  it("rejette une 'failure reason' qui n'est pas du texte", async () => {
    nextBody = Buffer.from("d14:failure reasoni42ee");
    await assert.rejects(announceTo(), /failure reason/);
  });

  it("rejette une réponse qui n'est pas un dictionnaire", async () => {
    nextBody = Buffer.from("l4:spame");
    await assert.rejects(announceTo(), /not a dictionary/);
  });

  it("rejette une réponse sans 'interval' ou sans 'peers'", async () => {
    nextBody = Buffer.from("d5:peers0:e");
    await assert.rejects(announceTo(), /interval/);
    nextBody = Buffer.from("d8:intervali60ee");
    await assert.rejects(announceTo(), /peers/);
  });

  it("rejette des peers dont la longueur n'est pas un multiple de 6", async () => {
    nextBody = Buffer.from("d8:intervali60e5:peers5:abcdee");
    await assert.rejects(announceTo(), /multiple of 6/);
  });

  it("rejette une réponse HTTP en erreur avec son code", async () => {
    nextStatus = 404;
    nextBody = Buffer.from("<html>not found</html>");
    await assert.rejects(announceTo(), /tracker: HTTP 404/);
  });

  it("refuse un tracker UDP avant de faire la moindre requête", async () => {
    await assert.rejects(
      announceTo("", { trackerUrl: "udp://tracker.example:1337/announce" }),
      /unsupported protocol 'udp:' \(udp:\/\/tracker\.example:1337\/announce\)/,
    );
    assert.equal(requestCount, 0);
  });

  it("refuse une adresse de tracker invalide", async () => {
    await assert.rejects(announceTo("", { trackerUrl: "n'importe quoi" }));
    assert.equal(requestCount, 0);
  });
});
