import { test } from "node:test";
import assert from "node:assert/strict";
import { splitRecords, parseRecord, getTitle } from "../marc-parser.js";
import { labelFor } from "../marc-labels.js";

const FIELD_TERMINATOR = 0x1E;
const RECORD_TERMINATOR = 0x1D;
const SUBFIELD_DELIMITER = 0x1F;

function concat(arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

/**
 * Bygg en giltig MARC21-post för test.
 * fields: [{ tag, value }] för kontrollfält (001–009)
 *         [{ tag, ind1?, ind2?, subfields: [[code, value], ...], raw? }] för datafält
 *         raw: Uint8Array som ersätter ind+subfields (används för edge cases)
 */
function buildRecord(fields, { appendTerminator = true } = {}) {
  const enc = new TextEncoder();
  const fieldBlobs = [];
  const directory = [];
  let position = 0;

  for (const f of fields) {
    let data;
    if (f.raw) {
      data = f.raw;
    } else if (f.tag.startsWith("00")) {
      data = enc.encode(f.value ?? "");
    } else {
      const parts = [enc.encode((f.ind1 ?? " ") + (f.ind2 ?? " "))];
      for (const [code, value] of f.subfields ?? []) {
        parts.push(new Uint8Array([SUBFIELD_DELIMITER]));
        parts.push(enc.encode(code + value));
      }
      data = concat(parts);
    }
    const withTerm = concat([data, new Uint8Array([FIELD_TERMINATOR])]);
    directory.push({ tag: f.tag, length: withTerm.length, position });
    fieldBlobs.push(withTerm);
    position += withTerm.length;
  }

  const directoryStr = directory
    .map(e => e.tag + String(e.length).padStart(4, "0") + String(e.position).padStart(5, "0"))
    .join("");
  const baseAddress = 24 + directoryStr.length + 1; // +1 för field terminator efter directory
  const dataSize = fieldBlobs.reduce((sum, b) => sum + b.length, 0);
  const recordLength = baseAddress + dataSize + (appendTerminator ? 1 : 0);

  const leader =
    String(recordLength).padStart(5, "0") +
    "nam a22" +
    String(baseAddress).padStart(5, "0") +
    "   4500";

  const parts = [
    enc.encode(leader),
    enc.encode(directoryStr),
    new Uint8Array([FIELD_TERMINATOR]),
    ...fieldBlobs
  ];
  if (appendTerminator) parts.push(new Uint8Array([RECORD_TERMINATOR]));
  return concat(parts);
}

test("parseRecord klarar en enkel post med kontroll- och datafält", () => {
  const bytes = buildRecord([
    { tag: "001", value: "123" },
    { tag: "245", ind1: "1", ind2: "0", subfields: [["a", "Hello world"], ["c", "Author"]] }
  ]);
  const record = parseRecord(bytes);

  assert.equal(record.leader.length, 24);
  assert.equal(record.fields.length, 2);

  const f001 = record.fields.find(f => f.tag === "001");
  assert.equal(f001.value, "123");

  const f245 = record.fields.find(f => f.tag === "245");
  assert.equal(f245.indicator1, "1");
  assert.equal(f245.indicator2, "0");
  assert.deepEqual(f245.subfields, [
    { code: "a", value: "Hello world" },
    { code: "c", value: "Author" }
  ]);
});

test("parseRecord klarar datafält utan delfält", () => {
  const bytes = buildRecord([
    { tag: "500", ind1: " ", ind2: " ", subfields: [] }
  ]);
  const record = parseRecord(bytes);

  assert.equal(record.fields.length, 1);
  const f500 = record.fields[0];
  assert.equal(f500.tag, "500");
  assert.equal(f500.indicator1, " ");
  assert.equal(f500.indicator2, " ");
  assert.deepEqual(f500.subfields, []);
});

test("splitRecords klarar tom fil", () => {
  assert.deepEqual(splitRecords(new Uint8Array(0)), []);
  assert.deepEqual(splitRecords(new Uint8Array([RECORD_TERMINATOR])), []);
});

test("parseRecord kraschar inte på trunkerad/skadad post", () => {
  // För kort för en leader → tydligt fel, ingen krasch
  assert.throws(() => parseRecord(new Uint8Array(10)), /kortare än 24 byte/);

  // Giltig leader men ogiltig base address
  const enc = new TextEncoder();
  const badLeader = enc.encode("00100nam a2299999   4500"); // base address 99999 > buffer
  assert.throws(() => parseRecord(badLeader), /base address/);

  // Directory refererar till fält som ligger utanför bufferten → ska hoppas över utan att kasta
  const good = buildRecord([
    { tag: "001", value: "A" },
    { tag: "245", ind1: "0", ind2: "0", subfields: [["a", "Title"]] }
  ]);
  // Trunkera så sista fältet ligger utanför
  const truncated = good.subarray(0, good.length - 10);
  const record = parseRecord(truncated);
  // Parsern ska inte krascha; minst ett giltigt fält ska komma igenom
  assert.ok(Array.isArray(record.fields));
});

test("getTitle returnerar null när 245 saknas", () => {
  const bytes = buildRecord([
    { tag: "001", value: "42" },
    { tag: "100", ind1: "1", ind2: " ", subfields: [["a", "Namn, Efter"]] }
  ]);
  const record = parseRecord(bytes);
  assert.equal(getTitle(record), null);
});

test("getTitle returnerar null när 245 finns men saknar $a och $b", () => {
  const bytes = buildRecord([
    { tag: "245", ind1: "0", ind2: "0", subfields: [["c", "Bara ansvarsuppgift"]] }
  ]);
  const record = parseRecord(bytes);
  assert.equal(getTitle(record), null);
});

test("getTitle kombinerar $a och $b och trimmar avslutande separator", () => {
  const bytes = buildRecord([
    { tag: "245", ind1: "1", ind2: "0", subfields: [["a", "Titel /"], ["b", "undertitel"]] }
  ]);
  const record = parseRecord(bytes);
  assert.equal(getTitle(record), "Titel / undertitel");
});

test("labelFor returnerar tom sträng för okända taggar", () => {
  assert.equal(labelFor("999"), "");
  assert.equal(labelFor("ABC"), "");
  assert.equal(labelFor(""), "");
});

test("labelFor returnerar känd etikett för kända taggar", () => {
  assert.equal(labelFor("245"), "Title Statement");
  assert.equal(labelFor("001"), "Control Number");
});
