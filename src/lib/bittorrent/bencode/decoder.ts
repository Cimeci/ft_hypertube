import type { BencodeValue } from "./types";

export function decode(data: Buffer): BencodeValue {
    let index = 0;

    function parseValue(): BencodeValue {
        if (data[index] == 105){
            index++;

            let value = "";

            while (data[index] !== 101) {
                value += data[index];
                index++;
            }
            index++

            return Number(value);
        }

        if (data[index] >= 48 && data[index] <= 57){
            let lenght = data[index];
            let value = "";

            index++; // skip nunmber
            index++; // skip :

            while (lenght > 0) {
                value += data[index];
                index++;
                lenght--;
            }
            index++

            return Number(value);
        }

        if (data[index] == 108) {
            index++;
            let value[] = [];
            while (data[index] != 101)
                value += parseValue()
        }

    }
}