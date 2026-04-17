// MARC21 parser enligt ISO 2709.
// Record terminator: 0x1D, field terminator: 0x1E, subfield delimiter: 0x1F.

const RECORD_TERMINATOR = 0x1D;
const FIELD_TERMINATOR = 0x1E;
const SUBFIELD_DELIMITER = 0x1F;

/**
 * Dela upp en hel binärström i enskilda MARC-poster.
 * @param {Uint8Array} bytes – filinnehåll
 * @returns {Uint8Array[]} – enskilda post-byten (utan record terminator)
 */
export function splitRecords(bytes) {
  const records = [];
  let start = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === RECORD_TERMINATOR) {
      if (i > start) records.push(bytes.subarray(start, i));
      start = i + 1;
    }
  }
  // Sista posten utan avslutande terminator
  if (start < bytes.length) records.push(bytes.subarray(start));
  return records;
}

/**
 * Tolka en enskild MARC21-post.
 * @param {Uint8Array} bytes – en post (utan record terminator)
 * @returns {{leader: string, fields: Array}}
 */
export function parseRecord(bytes) {
  if (bytes.length < 24) {
    throw new Error("Post är kortare än 24 byte (ogiltig leader)");
  }

  const decoder = new TextDecoder("utf-8", { fatal: false });
  const leader = decoder.decode(bytes.subarray(0, 24));

  // Leader byte 12-16 = base address of data (startposition för data)
  const baseAddress = parseInt(leader.substring(12, 17), 10);
  if (isNaN(baseAddress) || baseAddress < 24 || baseAddress > bytes.length) {
    throw new Error("Ogiltig base address i leader");
  }

  // Directory ligger mellan byte 24 och baseAddress - 1 (innan field terminator)
  // Varje directory entry är 12 byte: 3 tag + 4 length + 5 position
  const directoryEnd = baseAddress - 1; // Field terminator innan första data
  const directoryBytes = bytes.subarray(24, directoryEnd);
  const entryCount = Math.floor(directoryBytes.length / 12);

  const fields = [];

  for (let i = 0; i < entryCount; i++) {
    const entry = decoder.decode(directoryBytes.subarray(i * 12, (i + 1) * 12));
    const tag = entry.substring(0, 3);
    const length = parseInt(entry.substring(3, 7), 10);
    const position = parseInt(entry.substring(7, 12), 10);

    if (isNaN(length) || isNaN(position)) continue;

    const fieldStart = baseAddress + position;
    const fieldEnd = fieldStart + length;
    if (fieldEnd > bytes.length) continue;

    // Fältets innehåll, exkl. avslutande field terminator
    let fieldBytes = bytes.subarray(fieldStart, fieldEnd);
    if (fieldBytes.length > 0 && fieldBytes[fieldBytes.length - 1] === FIELD_TERMINATOR) {
      fieldBytes = fieldBytes.subarray(0, fieldBytes.length - 1);
    }

    // Kontrollfält (tag 001–009): inga indikatorer, inga delfält – bara ett värde
    if (tag.startsWith("00")) {
      fields.push({
        tag,
        value: decoder.decode(fieldBytes)
      });
      continue;
    }

    // Datafält: 2 indikatorer följt av delfält som börjar med 0x1F
    if (fieldBytes.length < 2) {
      fields.push({ tag, indicator1: " ", indicator2: " ", subfields: [] });
      continue;
    }

    const indicator1 = String.fromCharCode(fieldBytes[0]);
    const indicator2 = String.fromCharCode(fieldBytes[1]);
    const contentBytes = fieldBytes.subarray(2);

    // Dela på subfield delimiter (0x1F). Första segmentet före första 0x1F är tomt/skippas.
    const subfields = [];
    let sfStart = -1;
    for (let j = 0; j < contentBytes.length; j++) {
      if (contentBytes[j] === SUBFIELD_DELIMITER) {
        if (sfStart !== -1) {
          const sfBytes = contentBytes.subarray(sfStart, j);
          if (sfBytes.length > 0) {
            const code = String.fromCharCode(sfBytes[0]);
            const value = decoder.decode(sfBytes.subarray(1));
            subfields.push({ code, value });
          }
        }
        sfStart = j + 1;
      }
    }
    // Sista delfältet
    if (sfStart !== -1 && sfStart < contentBytes.length) {
      const sfBytes = contentBytes.subarray(sfStart);
      const code = String.fromCharCode(sfBytes[0]);
      const value = decoder.decode(sfBytes.subarray(1));
      subfields.push({ code, value });
    }

    fields.push({ tag, indicator1, indicator2, subfields });
  }

  return { leader, fields };
}

/**
 * Extrahera en läsbar titel ur en post (från 245 $a + $b).
 * @param {object} record
 * @returns {string|null}
 */
export function getTitle(record) {
  const f = record.fields.find(f => f.tag === "245");
  if (!f || !f.subfields) return null;
  const a = f.subfields.find(s => s.code === "a");
  const b = f.subfields.find(s => s.code === "b");
  const parts = [a?.value, b?.value].filter(Boolean);
  if (!parts.length) return null;
  return parts.join(" ").replace(/\s*[\/\:]\s*$/, "").trim();
}
