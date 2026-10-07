// Lancer : npm run test:bt
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decode } from "./decoder.ts";

const bencode = (text: string) => decode(Buffer.from(text, "ascii"));

describe("bencode / integer", () => {
  it("décode un entier simple", () => {
    assert.equal(bencode("i42e"), 42);
  });

  it("décode zéro", () => {
    assert.equal(bencode("i0e"), 0);
  });

  it("décode un entier négatif", () => {
    assert.equal(bencode("i-3e"), -3);
  });

  it("décode un grand entier (taille d'un fichier > 4 Go)", () => {
    assert.equal(bencode("i5368709120e"), 5368709120);
  });
});

describe("bencode / string", () => {
  it("renvoie un Buffer, pas une string", () => {
    assert.ok(Buffer.isBuffer(bencode("4:spam")));
  });

  it("décode une string simple", () => {
    assert.deepEqual(bencode("4:spam"), Buffer.from("spam"));
  });

  it("décode une string vide", () => {
    assert.deepEqual(bencode("0:"), Buffer.alloc(0));
  });

  it("gère une longueur à plusieurs chiffres", () => {
    const text = "a".repeat(36);
    assert.deepEqual(bencode(`36:${text}`), Buffer.from(text));
  });

  it("garde les octets binaires intacts (comme les hash SHA1 de 'pieces')", () => {
    const binary = Buffer.from([0x00, 0xff, 0x86, 0x4c, 0x3a, 0x65]);
    const input = Buffer.concat([Buffer.from("6:"), binary]);
    assert.deepEqual(decode(input), binary);
  });
});

describe("bencode / list", () => {
  it("décode une liste vide", () => {
    assert.deepEqual(bencode("le"), []);
  });

  it("décode une liste de types mélangés", () => {
    assert.deepEqual(bencode("l4:spami7ee"), [Buffer.from("spam"), 7]);
  });

  it("décode des listes imbriquées", () => {
    assert.deepEqual(bencode("lli1ei2eeli3eee"), [[1, 2], [3]]);
  });
});

describe("bencode / dictionary", () => {
  it("décode un dictionnaire vide", () => {
    assert.deepEqual(bencode("de"), new Map());
  });

  it("décode un dictionnaire en Map avec des clés string", () => {
    assert.deepEqual(
      bencode("d3:cow3:moo4:spami42ee"),
      new Map<string, unknown>([
        ["cow", Buffer.from("moo")],
        ["spam", 42],
      ]),
    );
  });

  it("décode un dictionnaire imbriqué contenant une liste", () => {
    assert.deepEqual(
      bencode("d4:infod5:filesli1ei2eeee"),
      new Map([["info", new Map([["files", [1, 2]]])]]),
    );
  });
});

describe("bencode / vrai fichier .torrent (archive.org)", () => {
  const file = readFileSync(
    new URL("../__fixtures__/big-buck-bunny.torrent", import.meta.url),
  );

  const asMap = (value: unknown): Map<string, unknown> => {
    assert.ok(value instanceof Map, "on attend un dictionnaire (Map)");
    return value;
  };

  it("le fichier entier est un dictionnaire", () => {
    asMap(decode(file));
  });

  it("lit l'URL du tracker", () => {
    const announce = asMap(decode(file)).get("announce");
    assert.ok(Buffer.isBuffer(announce));
    assert.equal(announce.toString(), "http://bt1.archive.org:6969/announce");
  });

  it("lit 'piece length' dans le dictionnaire info", () => {
    const info = asMap(asMap(decode(file)).get("info"));
    assert.equal(info.get("piece length"), 524288);
  });

  it("'pieces' est une suite de hash SHA1 de 20 octets", () => {
    const pieces = asMap(asMap(decode(file)).get("info")).get("pieces");
    assert.ok(Buffer.isBuffer(pieces));
    assert.equal(pieces.length % 20, 0);
    assert.equal(
      pieces.subarray(0, 20).toString("hex"),
      "16864c989a17f0d88a4fef879c1a8497ec50f23c",
    );
  });
});

// Activer ce bloc (retirer `skip`) une fois que tout le reste passe.
// Tant que ton décodeur ne vérifie pas `index < data.length`, une entrée
// tronquée le fait boucler à l'infini et bloquerait tout le fichier de test.
describe(
  "bencode / entrées invalides",
  // { skip: "à activer quand le décodeur gère la fin des données" },
  () => {
    it("rejette un préfixe inconnu", () => {
      assert.throws(() => bencode("x"));
    });

    it("rejette un entier sans 'e' final", () => {
      assert.throws(() => bencode("i42"));
    });

    it("rejette une string plus courte que sa longueur annoncée", () => {
      assert.throws(() => bencode("5:abc"));
    });

    it("rejette une liste non fermée", () => {
      assert.throws(() => bencode("l4:spam"));
    });

    it("rejette des données en trop après la valeur", () => {
      assert.throws(() => bencode("i1ei2e"));
    });

    it("rejette les zéros en tête et le -0 (interdits par la spec)", () => {
      assert.throws(() => bencode("i03e"));
      assert.throws(() => bencode("i-0e"));
    });

    it("rejette un entier vide ou réduit à un signe", () => {
      assert.throws(() => bencode("ie"));
      assert.throws(() => bencode("i-e"));
    });

    it("rejette un '-' ailleurs qu'en première position", () => {
      assert.throws(() => bencode("i4-2e"));
      assert.throws(() => bencode("i--4e"));
    });

    it("rejette un caractère non numérique dans la longueur d'une string", () => {
      assert.throws(() => bencode("3x:abc"));
    });

    it("rejette une longueur de string sans ':'", () => {
      assert.throws(() => bencode("12345"));
    });

    it("rejette un dictionnaire non fermé", () => {
      assert.throws(() => bencode("d3:cow3:moo"));
    });

    it("rejette un dictionnaire avec une clé sans valeur", () => {
      assert.throws(() => bencode("d3:cowe"));
    });

    it("rejette une entrée vide", () => {
      assert.throws(() => decode(Buffer.alloc(0)));
    });
  },
);
