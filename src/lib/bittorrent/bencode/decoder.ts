import type { BencodeValue, DecodeResult } from "./types";

const CHAR_I = 0x69; // 'i' début d'un entier
const CHAR_L = 0x6c; // 'l' début d'une liste
const CHAR_D = 0x64; // 'd' début d'un dictionnaire
const CHAR_E = 0x65; // 'e' fin d'un entier / d'une liste / d'un dictionnaire
const CHAR_COLON = 0x3a; // ':' sépare la longueur d'une string de ses données
const CHAR_MINUS = 0x2d; // '-'
const CHAR_0 = 0x30; // '0'
const CHAR_9 = 0x39; // '9'

export function decodeWithRawValues(data: Buffer): DecodeResult {
    let index = 0;
    const rawValues = new Map<string, Buffer>()

    function parseValue(depth: number): BencodeValue {
        if (data[index] === CHAR_I) { // INTEGER
            index++; // skip i

            let digits = "";
            let sign = 1;

            if (data[index] === CHAR_MINUS) {
                sign = -1;
                index++;
            }

            while (data[index] !== CHAR_E) {
                if (index >= data.length)
                    throw new Error("bencode: unexpected end of data in integer");
                if (data[index] < CHAR_0 || data[index] > CHAR_9)
                    throw new Error(`bencode: invalid character in integer at index ${index}`);

                digits += data[index] - CHAR_0;
                index++;
            }
            if (!digits)
                throw new Error("bencode: integer has no digits");
            if (sign < 0 && digits[0] === "0")
                throw new Error("bencode: negative zero is not allowed");
            if (digits[0] === "0" && digits.length > 1)
                throw new Error("bencode: leading zeros are not allowed in integer");
            index++; // skip e

            return Number(digits) * sign;
        }

        if (data[index] >= CHAR_0 && data[index] <= CHAR_9) { // STRING
            let lengthDigits = "";

            while (data[index] !== CHAR_COLON) {
                if (index >= data.length)
                    throw new Error("bencode: unexpected end of data in string length");
                if (data[index] < CHAR_0 || data[index] > CHAR_9)
                    throw new Error(`bencode: invalid character in string length at index ${index}`);

                lengthDigits += data[index] - CHAR_0;
                index++;
            }
            index++; // skip :

            const length = Number(lengthDigits);
            if (index + length > data.length)
                throw new Error(`bencode: string of length ${length} exceeds end of data`);

            const value = data.subarray(index, index + length);
            index += length;
            return value;
        }

        if (data[index] === CHAR_L) { // LIST
            index++; // skip l
            const list: BencodeValue[] = [];

            while (data[index] !== CHAR_E) {
                if (index >= data.length)
                    throw new Error("bencode: unexpected end of data in list");

                list.push(parseValue(depth + 1));
            }
            index++; // skip e

            return list;
        }

        if (data[index] === CHAR_D) { // DICTIONARY
            index++; // skip d
            const dictionary = new Map<string, BencodeValue>();

            while (data[index] !== CHAR_E) {
                if (index >= data.length)
                    throw new Error("bencode: unexpected end of data in dictionary");

                const rawKey = parseValue(depth + 1);
                if (!Buffer.isBuffer(rawKey))
                    throw new Error("bencode: dictionary key must be a string");

                const key = rawKey.toString();
                const valueStart = index;
                const value = parseValue(depth + 1);
                if (depth === 0)
                    rawValues.set(key, data.subarray(valueStart, index))
                dictionary.set(key, value);
            }
            index++; // skip e

            return dictionary;
        }

        throw new Error(`bencode: unexpected byte ${data[index]} at index ${index}`);
    }

    const parsedValue: BencodeValue = parseValue(0);
    if (index !== data.length)
        throw new Error(`bencode: unexpected trailing data at index ${index}`);

    return { value: parsedValue, rawValues :rawValues };
}

export function decode(data: Buffer): BencodeValue {
    return decodeWithRawValues(data).value;
}