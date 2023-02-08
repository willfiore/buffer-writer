import { BufferOpts } from "./opts";

export class BufferReader {
    private _buffer: Uint8Array;
    private _dataView: DataView;
    private _byteOffset: number;
    private _littleEndian: boolean;

    constructor(buffer: Uint8Array, byteOffset?: number, opts?: BufferOpts) {
        this._buffer = buffer;
        this._byteOffset = byteOffset ?? 0;
        this._dataView = new DataView(this._buffer.buffer);
        this._littleEndian = opts?.endianness === "little";
    }

    get buffer(): ArrayBufferLike {
        return this._buffer;
    }

    get read(): number {
        return this._byteOffset;
    }

    readBool(): boolean | undefined {
        const value = this.readUint8();
        if (value === undefined) return undefined;

        return value === 1 ? true : false;
    }

    readUint8(): number | undefined {
        if (this._wouldOverflow(1)) return undefined;
        const value = this._dataView.getUint8(this._byteOffset);
        this._byteOffset += 1;

        return value;
    }

    readUint16(): number | undefined {
        if (this._wouldOverflow(2)) return undefined;
        const value = this._dataView.getUint16(this._byteOffset, this._littleEndian);
        this._byteOffset += 2;

        return value;
    }

    readUint32(): number | undefined {
        if (this._wouldOverflow(4)) return undefined;
        const value = this._dataView.getUint32(this._byteOffset, this._littleEndian);
        this._byteOffset += 4;

        return value;
    }

    readUint64(): bigint | undefined {
        if (this._wouldOverflow(8)) return undefined;
        const value = this._dataView.getBigUint64(this._byteOffset, this._littleEndian);
        this._byteOffset += 8;

        return value;
    }

    readSint8(): number | undefined {
        if (this._wouldOverflow(1)) return undefined;
        const value = this._dataView.getInt8(this._byteOffset);
        this._byteOffset += 1;

        return value;
    }

    readSint16(): number | undefined {
        if (this._wouldOverflow(2)) return undefined;
        const value = this._dataView.getInt16(this._byteOffset, this._littleEndian);
        this._byteOffset += 2;

        return value;
    }

    readSint32(): number | undefined {
        if (this._wouldOverflow(4)) return undefined;
        const value = this._dataView.getInt32(this._byteOffset, this._littleEndian);
        this._byteOffset += 4;

        return value;
    }

    readSint64(): bigint | undefined {
        if (this._wouldOverflow(8)) return undefined;
        const value = this._dataView.getBigInt64(this._byteOffset, this._littleEndian);
        this._byteOffset += 8;

        return value;
    }

    readBigInt(): bigint | undefined {
        const byteLength = this.readUint32();
        if (byteLength === undefined) return undefined;

        const bytes = new Array(byteLength);

        // Read in bytes
        const start = this._littleEndian ? byteLength - 1 : 0;
        const end   = this._littleEndian ? -1 : byteLength;
        const delta = this._littleEndian ? -1 : 1;

        for (let i = start; i !== end; i += delta) {
            const byte = this.readUint8();
            if (byte === undefined) return undefined;

            bytes[i] = byte;
        }

        // convert bytes back into hex
        const hex = bytes.map(e => e.toString(16).padStart(2, "0")).join("");

        let v = BigInt("0x" + hex);

        // Shift all numbers to right and xor if the first bit was signed
        v = (v >> BigInt(1)) ^ (v & BigInt(1) ? BigInt(-1) : BigInt(0));

        return v;
    }

    readFloat32(): number | undefined {
        if (this._wouldOverflow(4)) return undefined;
        const value = this._dataView.getFloat32(this._byteOffset, this._littleEndian);
        this._byteOffset += 4;

        return value;
    }

    readFloat64(): number | undefined {
        if (this._wouldOverflow(8)) return undefined;
        const value = this._dataView.getFloat64(this._byteOffset, this._littleEndian);
        this._byteOffset += 8;

        return value;
    }

    readString(): string | undefined {
        // Decode string length (4 bytes)
        if (this._wouldOverflow(4)) return undefined;
        const byteLength = this._dataView.getUint32(this._byteOffset, this._littleEndian);

        // Decode string
        if (this._wouldOverflow(byteLength)) return undefined;

        const decoder = new TextDecoder();
        const view = this._buffer.subarray(this._byteOffset + 4, this._byteOffset + 4 + byteLength);

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

    private _wouldOverflow(numBytesToRead: number): boolean {
        return this._byteOffset + numBytesToRead > this._buffer.byteLength;
    }
}
