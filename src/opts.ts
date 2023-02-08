export type Endianness = "big" | "little";

export type BufferOpts = Partial<{
    endianness: Endianness,
}>;
