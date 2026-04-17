import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { splitRecords, parseRecord, getTitle } from "../marc-parser.js";

function loadFixture(name) {
  const url = new URL(`../testdata/${name}`, import.meta.url);
  return new Uint8Array(readFileSync(fileURLToPath(url)));
}

test("one_record.mrc: parsar en enda post med förväntad titel och 001", () => {
  const bytes = loadFixture("one_record.mrc");
  const records = splitRecords(bytes);
  assert.equal(records.length, 1);

  const record = parseRecord(records[0]);
  assert.equal(record.leader.length, 24);

  const f001 = record.fields.find(f => f.tag === "001");
  assert.equal(f001?.value, "8349414");

  const f245 = record.fields.find(f => f.tag === "245");
  assert.ok(f245, "245 ska finnas");
  assert.ok(Array.isArray(f245.subfields) && f245.subfields.length > 0);

  assert.equal(getTitle(record), "Fjodor på rymmen");
});

test("many_records.mrc: alla poster parsas utan kast och har titel", () => {
  const bytes = loadFixture("many_records.mrc");
  const chunks = splitRecords(bytes);
  assert.equal(chunks.length, 761);

  let parsed = 0;
  let withTitle = 0;
  for (const chunk of chunks) {
    const record = parseRecord(chunk);
    parsed++;
    if (getTitle(record)) withTitle++;
  }
  assert.equal(parsed, 761);
  assert.equal(withTitle, 761);
});
