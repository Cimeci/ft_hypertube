const LEFT_BIT = 0b10000000;

export function hasPiece(bitfield: Buffer, index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;

    if (byteIndex >= bitfield.length)
        return false;

    const mask = LEFT_BIT >> bitIndex;

    return ( bitfield[byteIndex] & mask ) !== 0;
}

export function setPiece(bitfield: Buffer, index: number): void {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;

    if (byteIndex >= bitfield.length)
        return;

    const mask = LEFT_BIT >> bitIndex;

    bitfield[byteIndex] = bitfield[byteIndex] | mask;
}