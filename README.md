# buffer-writer

Simply read and write binary data. Useful when you want to serialize data
sequentially (e.g. network packets).

## Basic usage

```ts
import { BufferWriter, BufferReader } from "@willfiore/buffer-writer";

const w = new BufferWriter();
w.writeUint8(49);
w.writeString("hello world");
w.writeFloat64(1240.015);

const arr = new Uint8Array(w.buffer);

// send over the network, serialize to disk, etc...

const r = new BufferReader({ buffer: arr.buffer });

const v1 = r.readUint8();   // 49
const v2 = r.readString();  // "hello world"
const v3 = r.readFloat64(); // 1240.015

const v4 = r.readString(); // undefined (overread)
```

## Notes

- Strings are encoded as UTF-8 and serialized with a 32-bit length, followed by the string bytes.
