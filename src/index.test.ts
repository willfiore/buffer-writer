import { describe, expect, test } from "vitest";
import { BufferWriter, BufferReader } from ".";

describe("suite", () => {
    test("basic writing and reading", () => {
        const w = new BufferWriter();
        w.writeUint8(36);
        w.writeUint8(100);
        w.writeUint16(65500);
        w.writeUint32(120398);
        w.writeBool(true);
        w.writeBool(false);
        w.writeFloat32(128.0);
        w.writeFloat64(101.124098);
        w.writeString("hello world");
        w.writeBigInt(BigInt("-123456789012345678901234567890"));
        w.writeUint8(2);
        w.writeSint8(-44);
        w.writeSint8(44);
        w.writeSint16(-11000);
        w.writeSint16(11001);

        const r = new BufferReader({ buffer: w.buffer });

        expect(r.readUint8()).toBe(36);
        expect(r.readUint8()).toBe(100);
        expect(r.readUint16()).toBe(65500);
        expect(r.readUint32()).toBe(120398);
        expect(r.readBool()).toBe(true);
        expect(r.readBool()).toBe(false);
        expect(r.readFloat32()).toBe(128.0);
        expect(r.readFloat64()).toBe(101.124098);
        expect(r.readString()).toBe("hello world");
        expect(r.readBigInt()).toBe(BigInt("-123456789012345678901234567890"));
        expect(r.readUint8()).toBe(2);
        expect(r.readSint8()).toBe(-44);
        expect(r.readSint8()).toBe(44);
        expect(r.readSint16()).toBe(-11000);
        expect(r.readSint16()).toBe(11001);

        // overread fails
        expect(r.readUint8()).toBe(undefined);
    });

    test("bigint", () => {
        const w = new BufferWriter();
        w.writeBigInt(BigInt(1));
        w.writeBigInt(BigInt("123098123098123098120398123098"));
        w.writeBigInt(BigInt("-65441248761289017422784148792147890247890241078907894210741892124709897801422410789"));
        w.writeBigInt(BigInt("-135"));

        const r = new BufferReader({ buffer: w.buffer });
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

        const r = new BufferReader({ buffer: w.buffer });

        TEST_STRINGS.forEach(s => {
            expect(r.readString()).toBe(s);
        });
    });
});
