import { describe, expect, test } from "vitest";
import { BufferWriter, BufferReader } from ".";
import { BufferOpts } from "./opts";

describe("suite", () => {
    test("basic writing and reading", () => {
        function writeValues(writer: BufferWriter) {
            writer.writeUint8(36);
            writer.writeUint8(100);
            writer.writeUint16(65500);
            writer.writeUint32(120398);
            writer.writeBool(true);
            writer.writeBool(false);
            writer.writeFloat32(128.0);
            writer.writeFloat64(101.124098);
            writer.writeString("hello world");
            writer.writeBigInt(BigInt("-123456789012345678901234567890"));
            writer.writeUint8(2);
            writer.writeSint8(-44);
            writer.writeSint8(44);
            writer.writeSint16(-11000);
            writer.writeSint16(11001);
        }

        function readValues(reader: BufferReader) {
            expect(reader.readUint8()).toBe(36);
            expect(reader.readUint8()).toBe(100);
            expect(reader.readUint16()).toBe(65500);
            expect(reader.readUint32()).toBe(120398);
            expect(reader.readBool()).toBe(true);
            expect(reader.readBool()).toBe(false);
            expect(reader.readFloat32()).toBe(128.0);
            expect(reader.readFloat64()).toBe(101.124098);
            expect(reader.readString()).toBe("hello world");
            expect(reader.readBigInt()).toBe(BigInt("-123456789012345678901234567890"));
            expect(reader.readUint8()).toBe(2);
            expect(reader.readSint8()).toBe(-44);
            expect(reader.readSint8()).toBe(44);
            expect(reader.readSint16()).toBe(-11000);
            expect(reader.readSint16()).toBe(11001);

            // overread fails
            expect(reader.readUint8()).toBe(undefined);
        }

        const OPTS_PERMUTATIONS: (BufferOpts | undefined)[] = [
            undefined,
            {},
            { endianness: "big" },
            { endianness: "little" },
        ];

        OPTS_PERMUTATIONS.forEach(opts => {
            const writer = new BufferWriter(undefined, opts);
            expect(writer.managed).toBe(true);

            writeValues(writer);
            const reader = new BufferReader(writer.buffer, undefined, opts);
            readValues(reader);
        });
    });

    test("overwrite unmanaged buffer", () => {
        const arr = new Uint8Array(8);
        const w = new BufferWriter(arr);

        expect(w.managed).toBe(false);

        expect(w.writeUint32(100)).toBe(true);
        expect(w.writeUint16(100)).toBe(true);
        expect(w.writeUint8(100)).toBe(true);
        expect(w.writeUint8(100)).toBe(true);
        expect(w.writeUint8(100)).toBe(false);
    });

    test("overread string", () => {
        const buffer = new Uint8Array([0, 0, 0, 4, 97, 98, 99]); // string length is too long for buffer
        const r = new BufferReader(buffer);

        const str = r.readString();
        expect(str).toBeUndefined();
    });

    test("bigint", () => {
        const w = new BufferWriter();
        w.writeBigInt(BigInt(1));
        w.writeBigInt(BigInt("123098123098123098120398123098"));
        w.writeBigInt(BigInt("-65441248761289017422784148792147890247890241078907894210741892124709897801422410789"));
        w.writeBigInt(BigInt("-135"));

        const r = new BufferReader(w.buffer);
        expect(r.readBigInt()).toBe(BigInt(1));
        expect(r.readBigInt()).toBe(BigInt("123098123098123098120398123098"));
        expect(r.readBigInt()).toBe(BigInt("-65441248761289017422784148792147890247890241078907894210741892124709897801422410789"));
        expect(r.readBigInt()).toBe(BigInt("-135"));
    });

    test("valid utf8 tests", () => {

        const TEST_STRINGS = [
            "ABCDEFG",
            "Ḽơᶉëᶆ ȋṕšᶙṁ ḍỡḽǭᵳ ʂǐť ӓṁệẗ",
            "Σὲ γνωρίζω ἀπὸ τὴν κόψη τοῦ σπαθιοῦ τὴν τρομερή, σὲ γνωρίζω ἀπὸ τὴν ὄψη ποὺ μὲ βία μετράει τὴ γῆ.",
            "ᚻᛖ ᚳᚹᚫᚦ ᚦᚫᛏ ᚻᛖ ᛒᚢᛞᛖ ᚩᚾ ᚦᚫᛗ ᛚᚪᚾᛞᛖ ᚾᚩᚱᚦᚹᛖᚪᚱᛞᚢᛗ ᚹᛁᚦ ᚦᚪ ᚹᛖᛥᚫ",
            "⡍⠜⠇⠑⠹ ⠺⠁⠎ ⠙⠑⠁⠙⠒ ⠞⠕ ⠃⠑⠛⠔ ⠺⠊⠹⠲ ⡹⠻⠑ ⠊⠎ ⠝⠕ ⠙⠳⠃⠞",
            "コンニチハ",

            `
  ╔══╦══╗  ┌──┬──┐  ╭──┬──╮  ╭──┬──╮  ┏━━┳━━┓  ┎┒┏┑   ╷  ╻ ┏┯┓ ┌┰┐    ▊ ╱╲╱╲╳╳╳
  ║┌─╨─┐║  │╔═╧═╗│  │╒═╪═╕│  │╓─╁─╖│  ┃┌─╂─┐┃  ┗╃╄┙  ╶┼╴╺╋╸┠┼┨ ┝╋┥    ▋ ╲╱╲╱╳╳╳
  ║│╲ ╱│║  │║   ║│  ││ │ ││  │║ ┃ ║│  ┃│ ╿ │┃  ┍╅╆┓   ╵  ╹ ┗┷┛ └┸┘    ▌ ╱╲╱╲╳╳╳
  ╠╡ ╳ ╞╣  ├╢   ╟┤  ├┼─┼─┼┤  ├╫─╂─╫┤  ┣┿╾┼╼┿┫  ┕┛┖┚     ┌┄┄┐ ╎ ┏┅┅┓ ┋ ▍ ╲╱╲╱╳╳╳
  ║│╱ ╲│║  │║   ║│  ││ │ ││  │║ ┃ ║│  ┃│ ╽ │┃  ░░▒▒▓▓██ ┊  ┆ ╎ ╏  ┇ ┋ ▎
  ║└─╥─┘║  │╚═╤═╝│  │╘═╪═╛│  │╙─╀─╜│  ┃└─╂─┘┃  ░░▒▒▓▓██ ┊  ┆ ╎ ╏  ┇ ┋ ▏
  ╚══╩══╝  └──┴──┘  ╰──┴──╯  ╰──┴──╯  ┗━━┻━━┛           └╌╌┘ ╎ ┗╍╍┛ ┋  ▁▂▃▄▅▆▇█ `,
        ];

        const w = new BufferWriter();

        TEST_STRINGS.forEach(s => w.writeString(s));

        const r = new BufferReader(w.buffer);

        TEST_STRINGS.forEach(s => {
            expect(r.readString()).toBe(s);
        });
    });
});

describe("write / read int", () => {
    test("u8 range - 1", () => {
        const writer = new BufferWriter();
        writer.writeInt(4, 2, 10);
        expect(writer.buffer).toStrictEqual(new Uint8Array([4 - 2]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(2, 10)).toEqual(4);
    });

    test("u8 range - 2", () => {
        const writer = new BufferWriter();
        writer.writeInt(100, 0, 255);
        expect(writer.buffer).toStrictEqual(new Uint8Array([100]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(0, 255)).toEqual(100);
    });

    test("u16 range - 1", () => {
        const writer = new BufferWriter();
        writer.writeInt(256, 0, 256);
        expect(writer.buffer).toStrictEqual(new Uint8Array([1, 0]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(0, 256)).toEqual(256);
    });

    test("u16 range - 2", () => {
        const writer = new BufferWriter();
        writer.writeInt(12111, 344, 32667);
        expect(writer.buffer).toStrictEqual(new Uint8Array([45, 247]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(344, 32667)).toEqual(12111);
    });

    test("u16 range - 3", () => {
        const writer = new BufferWriter();
        writer.writeInt(22222, 0, 65535);
        expect(writer.buffer).toStrictEqual(new Uint8Array([86, 206]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(0, 65535)).toEqual(22222);
    });

    test("u32 range - 1", () => {
        const writer = new BufferWriter();
        writer.writeInt(65536, 0, 65536);
        expect(writer.buffer).toStrictEqual(new Uint8Array([0, 1, 0, 0]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(0, 65536)).toEqual(65536);
    });

    test("u32 range - 1", () => {
        const writer = new BufferWriter();
        writer.writeInt(65538, 0, 165536);
        expect(writer.buffer).toStrictEqual(new Uint8Array([0, 1, 0, 2]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readInt(0, 165536)).toEqual(65538);
    });
});

describe("write / read string", () => {
    test("bounded u8 string", () => {
        const writer = new BufferWriter();
        writer.writeString("abc", 255);

        expect(writer.buffer).toStrictEqual(new Uint8Array([
            // length stored in one byte, because the string cannot be longer than 255 characters.
            3,
            97, 98, 99,
        ]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readString(255)).toBe("abc");
    });

    test("bounded u16 string", () => {
        const writer = new BufferWriter();
        writer.writeString("abc", 65535);

        expect(writer.buffer).toStrictEqual(new Uint8Array([
            // length stored in two bytes, because the string cannot be longer than 65535 characters.
            0, 3,
            97, 98, 99,
        ]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readString(65535)).toBe("abc");
    });

    test("bounded u32 string", () => {
        const writer = new BufferWriter();
        writer.writeString("abc", 65538);

        expect(writer.buffer).toStrictEqual(new Uint8Array([
            // length stored in four bytes
            0, 0, 0, 3,
            97, 98, 99,
        ]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readString(65538)).toBe("abc");
    });

    test("unbounded string", () => {
        const writer = new BufferWriter();
        writer.writeString("abc");

        expect(writer.buffer).toStrictEqual(new Uint8Array([
            // length stored in four bytes
            0, 0, 0, 3,
            97, 98, 99,
        ]));

        const reader = new BufferReader(writer.buffer);
        expect(reader.readString()).toBe("abc");
    });
});
