export type BencodeValue =
  | number
  | Buffer
  | BencodeValue[]
  | Map<string, BencodeValue>;