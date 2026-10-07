export type BencodeValue =
  | number
  | Buffer
  | BencodeValue[]
  | Map<string, BencodeValue>;

export interface DecodeResult {
  value: BencodeValue;
  rawValues: Map<string, Buffer>;
}