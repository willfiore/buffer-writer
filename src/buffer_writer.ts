type BufferWriterOpts = {
    /** Wrap an existing buffer. If this is omitted, a new buffer will be created. */
    wrapExisting?: {
        buffer: ArrayBufferLike,
        byteOffset?: number,
    },
};

export class BufferWriter {
    private _buffer: ArrayBufferLike;
    private _dataView: DataView;

    private _byteOffset: number;

    constructor(opts?: BufferWriterOpts) {
        this._buffer = opts?.wrapExisting?.buffer ?? new ArrayBuffer(1024);
        this._byteOffset = opts?.wrapExisting?.byteOffset ?? 0;
        this._dataView = new DataView(this._buffer);
    }

    get buffer(): ArrayBufferLike {
        return this._buffer.slice(0, this._byteOffset);
    }

    private maybeReallocate(byteLength: number) {
        const newByteLength = this._byteOffset + byteLength;

        if (newByteLength <= this._buffer.byteLength) {
            return;
        }

        // Next power of two
        let nextCapacity = this._buffer.byteLength;

        while (nextCapacity <= newByteLength) {
            nextCapacity *= 2;
        }

        const n = new Uint8Array(nextCapacity);
        n.set(new Uint8Array(this.buffer));

        this._buffer = n.buffer;
        this._dataView = new DataView(this._buffer);
    }

    writeBool(value: boolean) {
        this.maybeReallocate(1);

        const b = value ? 1 : 0;

        this._dataView.setUint8(this._byteOffset, b);
        this._byteOffset +=1;
    }

    writeUint8(value: number) {
        this.maybeReallocate(1);

        this._dataView.setUint8(this._byteOffset, value);
        this._byteOffset += 1;
    }

    writeUint16(value: number) {
        this.maybeReallocate(2);

        this._dataView.setUint16(this._byteOffset, value);
        this._byteOffset += 2;
    }

    writeUint32(value: number) {
        this.maybeReallocate(4);

        this._dataView.setUint32(this._byteOffset, value);
        this._byteOffset += 4;
    }

    writeUint64(value: bigint) {
        this.maybeReallocate(8);

        this._dataView.setBigUint64(this._byteOffset, value);
        this._byteOffset += 8;
    }

    writeBigInt(value: bigint) {
        // Adapted from https://stackoverflow.com/a/74246085

        // shift 1 step to the left, and XOR if less than 0
        value = (value << BigInt(1)) ^ (value < BigInt(0) ? BigInt(-1) : BigInt(0));

        // convert to hex
        let hex = value.toString(16);

        // pad if neccesseery
        if (hex.length % 2) hex = '0' + hex;

        const byteLength = hex.length / 2;
        this.writeUint32(byteLength);

        for (let i = 0; i < byteLength; ++i) {
            const j = i * 2;
            const v = parseInt(hex.slice(j, j + 2), 16);

            this.writeUint8(v);
        }
    }

    writeFloat32(value: number) {
        this.maybeReallocate(4);

        this._dataView.setFloat32(this._byteOffset, value);
        this._byteOffset += 4;
    }

    writeFloat64(value: number) {
        this.maybeReallocate(8);

        this._dataView.setFloat64(this._byteOffset, value);
        this._byteOffset += 8;
    }

    writeString(value: string) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(value);

        this.maybeReallocate(4 + bytes.byteLength);

        this.writeUint32(bytes.byteLength);

        new Uint8Array(this._buffer).set(bytes, this._byteOffset);
        this._byteOffset += bytes.byteLength;
    }
}
