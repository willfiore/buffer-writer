import { BufferOpts, Endianness } from "./opts";

export class BufferWriter {
    private _buffer: Uint8Array;
    private _byteOffset: number;
    private _dataView: DataView;
    private _managed: boolean;
    private _littleEndian: boolean;

    constructor(buffer?: Uint8Array, opts?: BufferOpts) {
        if (buffer !== undefined) {
            this._buffer = buffer;
            this._managed = false;
        } else {
            this._buffer = new Uint8Array(1024);
            this._managed = true;
        }

        this._byteOffset = 0;
        this._dataView = new DataView(this._buffer.buffer);
        this._littleEndian = opts?.endianness === "little";
    }

    get buffer(): Uint8Array {
        return this._buffer.subarray(0, this._byteOffset);
    }

    get managed(): boolean {
        return this._managed;
    }

    get written(): number {
        return this._byteOffset;
    }

    writeBool(value: boolean): boolean {
        if (!this._maybeReallocate(1)) return false;

        const b = value ? 1 : 0;

        this._dataView.setUint8(this._byteOffset, b);
        this._byteOffset +=1;

        return true;
    }

    writeUint8(value: number): boolean {
        if (!this._maybeReallocate(1)) return false;

        this._dataView.setUint8(this._byteOffset, value);
        this._byteOffset += 1;

        return true;
    }

    writeUint16(value: number): boolean {
        if (!this._maybeReallocate(2)) return false;

        this._dataView.setUint16(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 2;

        return true;
    }

    writeUint32(value: number): boolean {
        if (!this._maybeReallocate(4)) return false;

        this._dataView.setUint32(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 4;

        return true;
    }

    writeUint64(value: bigint): boolean {
        if (!this._maybeReallocate(8)) return false;

        this._dataView.setBigUint64(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 8;

        return true;
    }

    writeSint8(value: number): boolean {
        if (!this._maybeReallocate(1)) return false;

        this._dataView.setInt8(this._byteOffset, value);
        this._byteOffset += 1;

        return true;
    }

    writeSint16(value: number): boolean {
        if (!this._maybeReallocate(2)) return false;

        this._dataView.setInt16(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 2;

        return true;
    }

    writeSint32(value: number): boolean {
        if (!this._maybeReallocate(4)) return false;

        this._dataView.setInt32(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 4;

        return true;
    }

    writeSint64(value: bigint): boolean {
        if (!this._maybeReallocate(8)) return false;

        this._dataView.setBigInt64(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 8;

        return true;
    }

    writeBigInt(value: bigint): boolean {
        // Adapted from https://stackoverflow.com/a/74246085

        // shift 1 step to the left, and XOR if less than 0
        value = (value << BigInt(1)) ^ (value < BigInt(0) ? BigInt(-1) : BigInt(0));

        // convert to hex
        let hex = value.toString(16);

        // pad if neccesseery
        if (hex.length % 2) hex = '0' + hex;

        const byteLength = hex.length / 2;

        if (!this._maybeReallocate(4 + byteLength)) return false;

        this.writeUint32(byteLength);

        const start = this._littleEndian ? byteLength - 1 : 0;
        const end   = this._littleEndian ? -1 : byteLength;
        const delta = this._littleEndian ? -1 : 1;

        for (let i = start; i !== end; i += delta) {
            const j = i * 2;
            const v = parseInt(hex.slice(j, j + 2), 16);

            this.writeUint8(v);
        }

        return true;
    }

    writeFloat32(value: number): boolean {
        if (!this._maybeReallocate(4)) return false;

        this._dataView.setFloat32(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 4;

        return true;
    }

    writeFloat64(value: number): boolean {
        if (!this._maybeReallocate(8)) return false;

        this._dataView.setFloat64(this._byteOffset, value, this._littleEndian);
        this._byteOffset += 8;

        return true;
    }

    writeString(value: string) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);

        if (!this._maybeReallocate(4 + bytes.byteLength)) return false;
        this.writeUint32(bytes.byteLength);

        this._buffer.set(bytes, this._byteOffset);
        this._byteOffset += bytes.byteLength;

        return true;
    }

    private _maybeReallocate(byteLength: number): boolean {
        const newByteLength = this._byteOffset + byteLength;

        if (newByteLength <= this._buffer.byteLength) {
            return true;
        }

        if (!this.managed) {
            return false;
        }

        // Next power of two
        let nextCapacity = this._buffer.byteLength;

        while (nextCapacity <= newByteLength) {
            nextCapacity *= 2;
        }

        const newBuffer = new Uint8Array(nextCapacity);
        newBuffer.set(new Uint8Array(this.buffer));

        this._buffer = newBuffer;
        this._dataView = new DataView(this._buffer.buffer);

        return true;
    }
}
