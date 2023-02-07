type BufferReaderOpts = {
    buffer: ArrayBufferLike,
    offset?: number,
};

export class BufferReader {
    private _buffer: ArrayBufferLike;
    private _dataView: DataView;
    private _byteOffset: number;

    constructor(opts: BufferReaderOpts) {
        this._buffer = opts.buffer;
        this._byteOffset = opts.offset ?? 0;
        this._dataView = new DataView(this._buffer);
    }

    get buffer(): ArrayBufferLike {
        return this._buffer;
    }

    private wouldOverflow(numBytesToRead: number): boolean {
        return this._byteOffset + numBytesToRead > this._buffer.byteLength;
    }

    readBool(): boolean | undefined {
        const value = this.readUint8();
        if (value === undefined) return undefined;

        return value === 1 ? true : false;
    }

    readUint8(): number | undefined {
        if (this.wouldOverflow(1)) return undefined;
        const value = this._dataView.getUint8(this._byteOffset);
        this._byteOffset += 1;

        return value;
    }

    readUint16(): number | undefined {
        if (this.wouldOverflow(2)) return undefined;
        const value = this._dataView.getUint16(this._byteOffset);
        this._byteOffset += 2;

        return value;
    }

    readUint32(): number | undefined {
        if (this.wouldOverflow(4)) return undefined;
        const value = this._dataView.getUint32(this._byteOffset);
        this._byteOffset += 4;

        return value;
    }

    readUint64(): bigint | undefined {
        if (this.wouldOverflow(8)) return undefined;
        const value = this._dataView.getBigUint64(this._byteOffset);
        this._byteOffset += 8;

        return value;
    }

    readBigInt(): bigint | undefined {
        const byteLength = this.readUint32();
        if (byteLength === undefined) return undefined;

        const bytes = [];

        // Read in bytes
        for (let i = 0; i < byteLength; ++i) {
            const byte = this.readUint8();
            if (byte === undefined) return undefined;

            bytes.push(byte);
        }

        // convert bytes back into hex
        const hex = bytes.map(e => e.toString(16).padStart(2, "0")).join("");

        let v = BigInt("0x" + hex);

        // Shift all numbers to right and xor if the first bit was signed
        v = (v >> BigInt(1)) ^ (v & BigInt(1) ? BigInt(-1) : BigInt(0));

        return v;
    }

    readFloat32(): number | undefined {
        if (this.wouldOverflow(4)) return undefined;
        const value = this._dataView.getFloat32(this._byteOffset);
        this._byteOffset += 4;

        return value;
    }

    readFloat64(): number | undefined {
        if (this.wouldOverflow(8)) return undefined;
        const value = this._dataView.getFloat64(this._byteOffset);
        this._byteOffset += 8;

        return value;
    }

    readString(): string | undefined {
        // Decode string length (4 bytes)
        if (this.wouldOverflow(4)) return undefined;
        const byteLength = this._dataView.getUint32(this._byteOffset);

        // Decode string
        if (this.wouldOverflow(byteLength)) return undefined;

        const decoder = new TextDecoder();
        const view = new Uint8Array(this._buffer, this._byteOffset + 4, byteLength);

        let value: string;

        try {
            value = decoder.decode(view);
        } catch (err: unknown) {
            return undefined;
        }

        // Increment byte offset
        this._byteOffset += 4 + byteLength;

        return value;
    }
}
