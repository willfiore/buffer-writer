# buffer-writer

Simply read and write binary data. Useful when you want to serialize data
sequentially (e.g. network packets).

## Basic usage

```ts
import { BufferWriter, BufferReader } from "@willfiore/buffer-writer";

const writer = new BufferWriter();
writer.writeUint8(49);
writer.writeString("hello world");
writer.writeFloat64(1240.015);

const buffer = writer.buffer;

// send over the network, serialize to disk, etc...

const reader = new BufferReader(buffer);

const v1 = reader.readUint8();   // 49
const v2 = reader.readString();  // "hello world"
const v3 = reader.readFloat64(); // 1240.015

const v4 = reader.readString();  // undefined (buffer overread)
```

## Write to an existing buffer

You can pass a `Uint8Array` to `new BufferWriter` to adopt an existing buffer.

In this case, the `BufferWriter` will be in "non-managed" mode. In this mode,
writing will fail if it would overrun the boundary of the passed in buffer.

```ts
const buffer = new Uint8Array(8);
const writer = new BufferWriter(buffer);

console.log(writer.managed); // false

writer.writeUint32(0); // true
writer.writeUint32(0); // true
writer.writeUint8(0);  // false (buffer overwrite)
```

## Notes on the binary format

- Multi-byte values are written as big-endian by default. This can be changed with the `endianness` option.
- Strings are encoded as UTF-8 and serialized with a 32-bit length, followed by
the string bytes. Strings are not null-terminated.
