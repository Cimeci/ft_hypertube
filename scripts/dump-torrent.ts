// Affiche la structure décodée d'un fichier .torrent
// Usage : npm run dump:torrent -- <fichier.torrent>
import { readFileSync } from "node:fs";
import { decode } from "../src/lib/bittorrent/bencode/decoder.ts";
import type { BencodeValue } from "../src/lib/bittorrent/bencode/types.ts";

const MAX_TEXT_LENGTH = 80;
const SHA1_LENGTH = 20;
const MAX_HASHES_SHOWN = 3;

function isPrintable(buffer: Buffer): boolean {
    return buffer.every((byte) => byte === 0x0a || (byte >= 0x20 && byte <= 0x7e));
}

function formatBuffer(buffer: Buffer, key: string | undefined, indent: string): string {
    if (key === "pieces") {
        const count = buffer.length / SHA1_LENGTH;
        const lines = [];
        for (let i = 0; i < Math.min(count, MAX_HASHES_SHOWN); i++) {
            const hash = buffer.subarray(i * SHA1_LENGTH, (i + 1) * SHA1_LENGTH);
            lines.push(`${indent}  [${i}] ${hash.toString("hex")}`);
        }
        if (count > MAX_HASHES_SHOWN)
            lines.push(`${indent}  … ${count - MAX_HASHES_SHOWN} autres`);
        return `<binaire, ${buffer.length} octets = ${count} hash SHA1>\n${lines.join("\n")}`;
    }

    if (!isPrintable(buffer))
        return `<binaire, ${buffer.length} octets> ${buffer.subarray(0, 16).toString("hex")}…`;

    const text = buffer.toString().replaceAll("\n", "\\n");
    return text.length > MAX_TEXT_LENGTH
        ? `"${text.slice(0, MAX_TEXT_LENGTH)}…" (${buffer.length} octets)`
        : `"${text}"`;
}

function format(value: BencodeValue, indent = "", key?: string): string {
    if (typeof value === "number")
        return `${value}`;

    if (Buffer.isBuffer(value))
        return formatBuffer(value, key, indent);

    const childIndent = `${indent}  `;

    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        const items = value.map((item) => `${childIndent}- ${format(item, childIndent)}`);
        return `liste (${value.length})\n${items.join("\n")}`;
    }

    if (value.size === 0) return "{}";
    const entries = [...value].map(
        ([entryKey, entryValue]) => `${childIndent}${entryKey}: ${format(entryValue, childIndent, entryKey)}`,
    );
    return `dictionnaire (${value.size} clés)\n${entries.join("\n")}`;
}

const path = process.argv[2];
if (!path) {
    console.error("Usage : npm run dump:torrent -- <fichier.torrent>");
    process.exit(1);
}

console.log(format(decode(readFileSync(path))));
