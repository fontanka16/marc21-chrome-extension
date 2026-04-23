import { splitRecords, parseRecord, getTitle } from "./marc-parser.js";
import { labelFor } from "./marc-labels.js";

const PAGE_SIZE = 20;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
let allRecords = [];
let filteredRecords = [];
let currentPage = 0;

const ERROR_MESSAGES = {
  permission_denied: "Behörighet att hämta filen nekades. Aktivera domänen under Inställningar → Tillägg → MARC21 Viewer → Webbplatsåtkomst.",
  http_error: "Servern svarade med ett fel.",
  too_large: "Filen är för stor för att visas (max 20 MB).",
  empty: "Servern returnerade en tom fil.",
  invalid_url: "Ogiltig URL.",
  network: "Kunde inte ansluta till servern.",
  missing_key: "Filen hittades inte. Försök igen.",
  decode_failed: "Kunde inte läsa filens innehåll.",
  parse_failed: "Fel vid tolkning av MARC-filen.",
  no_records_parsed: "Ingen av posterna kunde tolkas. Filen är troligen skadad eller inte i ISO 2709-format.",
  no_source: "Ingen fil angiven. Högerklicka på en .mrc-, .marc- eller _compilemarc-länk och välj \"Öppna i MARC21 Viewer\", eller klicka på tilläggsikonen för att välja en lokal fil.",
  too_large: "Filen är för stor för att visas (max 20 MB).",
  read_failed: "Kunde inte läsa filen från disken."
};

const params = new URLSearchParams(location.search);
const status = document.getElementById("status");
const container = document.getElementById("records-container");

function showError(text, detail) {
  status.textContent = "";
  status.style.display = "block";
  const span = document.createElement("span");
  span.className = "error";
  span.textContent = text;
  status.appendChild(span);
  if (detail) {
    status.appendChild(document.createElement("br"));
    const small = document.createElement("small");
    small.textContent = detail;
    status.appendChild(small);
  }
}

function errorMessage(code) {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.network;
}

function loadBuffer(arrayBuffer, filename) {
  document.getElementById("filename-display").textContent = filename;
  document.title = "MARC21: " + filename;

  try {
    const bytes = new Uint8Array(arrayBuffer);
    const recordChunks = splitRecords(bytes);

    if (recordChunks.length === 0) {
      status.textContent = "Inga poster hittades i filen.";
      return;
    }

    status.textContent = `Tolkar ${recordChunks.length} post${recordChunks.length === 1 ? "" : "er"}…`;

    allRecords = [];
    for (const chunk of recordChunks) {
      try {
        allRecords.push(parseRecord(chunk));
      } catch (e) {
        console.warn("Kunde inte tolka post:", e.message);
      }
    }

    if (allRecords.length === 0) {
      showError(errorMessage("no_records_parsed"));
      return;
    }

    filteredRecords = allRecords;
    document.getElementById("total-count").textContent = allRecords.length;
    document.getElementById("stats").style.display = "flex";
    document.getElementById("search-bar").style.display = "flex";
    status.style.display = "none";

    renderPage(0);
    setupSearch();
    setupPagination();
  } catch (e) {
    console.warn("Parse failed:", e);
    showError(errorMessage("parse_failed"));
  }
}

function renderPage(page) {
  currentPage = page;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filteredRecords.length);
  const pageRecords = filteredRecords.slice(start, end);

  container.innerHTML = "";

  if (pageRecords.length === 0) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:#666;text-align:center;padding:30px;";
    empty.textContent = "Inga poster matchar sökningen.";
    container.appendChild(empty);
  }

  pageRecords.forEach((record, i) => {
    const globalIdx = start + i + 1;
    const title = getTitle(record) || "(Ingen titel)";

    const card = document.createElement("div");
    card.className = "record-card";

    const header = document.createElement("div");
    header.className = "record-header";

    const numSpan = document.createElement("span");
    numSpan.className = "rec-num";
    numSpan.textContent = "#" + globalIdx;

    const titleSpan = document.createElement("span");
    titleSpan.className = "rec-title";
    titleSpan.textContent = title;

    const toggleSpan = document.createElement("span");
    toggleSpan.className = "toggle-icon";
    toggleSpan.textContent = "▼";

    header.append(numSpan, titleSpan, toggleSpan);

    const body = document.createElement("div");
    body.className = "record-body";

    if (record.leader) {
      const leaderRow = document.createElement("div");
      leaderRow.className = "leader-row";
      leaderRow.textContent = "Leader: " + record.leader;
      body.appendChild(leaderRow);
    }

    const table = document.createElement("table");
    table.className = "fields-table";

    for (const field of record.fields) {
      const tr = document.createElement("tr");

      const tdTag = document.createElement("td");
      tdTag.className = "field-tag";
      tdTag.textContent = field.tag;

      const tdLabel = document.createElement("td");
      tdLabel.className = "field-label";
      tdLabel.textContent = labelFor(field.tag);

      const tdInd = document.createElement("td");
      tdInd.className = "field-indicator";
      if (field.indicator1 !== undefined) {
        tdInd.textContent = (field.indicator1 === " " ? "#" : field.indicator1) +
                             (field.indicator2 === " " ? "#" : field.indicator2);
      }

      const tdVal = document.createElement("td");
      tdVal.className = "field-value";

      if (field.subfields) {
        for (const sf of field.subfields) {
          const codeSpan = document.createElement("span");
          codeSpan.className = "subfield-code";
          codeSpan.textContent = "$" + sf.code;
          tdVal.appendChild(codeSpan);
          tdVal.appendChild(document.createTextNode(" " + (sf.value || "") + " "));
        }
      } else {
        tdVal.textContent = field.value || "";
      }

      tr.append(tdTag, tdLabel, tdInd, tdVal);
      table.appendChild(tr);
    }

    body.appendChild(table);
    card.append(header, body);
    container.appendChild(card);

    header.addEventListener("click", () => {
      const isOpen = body.classList.toggle("visible");
      header.classList.toggle("open", isOpen);
    });

    if (globalIdx === 1) {
      body.classList.add("visible");
      header.classList.add("open");
    }
  });

  document.getElementById("page-info").textContent = filteredRecords.length === 0
    ? "0 av 0"
    : `${start + 1}–${end} av ${filteredRecords.length}`;
  document.getElementById("page-label").textContent = `Sida ${page + 1} av ${totalPages}`;
  document.getElementById("prev-btn").disabled = page === 0;
  document.getElementById("next-btn").disabled = page >= totalPages - 1;
  document.getElementById("pagination").style.display = filteredRecords.length > PAGE_SIZE ? "flex" : "none";
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const info = document.getElementById("search-result-info");
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      filteredRecords = allRecords;
      info.textContent = "";
    } else {
      filteredRecords = allRecords.filter(record => {
        for (const f of record.fields) {
          if (f.tag.toLowerCase().includes(q)) return true;
          if (labelFor(f.tag).toLowerCase().includes(q)) return true;
          if (f.value && f.value.toLowerCase().includes(q)) return true;
          if (f.subfields) {
            for (const sf of f.subfields) {
              if (sf.value && sf.value.toLowerCase().includes(q)) return true;
            }
          }
        }
        return false;
      });
      info.textContent = `${filteredRecords.length} träff${filteredRecords.length === 1 ? "" : "ar"}`;
    }
    renderPage(0);
  });
}

function setupPagination() {
  document.getElementById("prev-btn").addEventListener("click", () => renderPage(currentPage - 1));
  document.getElementById("next-btn").addEventListener("click", () => renderPage(currentPage + 1));
}

function setupLocalFilePicker() {
  status.style.display = "none";
  const picker = document.getElementById("file-picker");
  const btn = document.getElementById("file-picker-btn");
  const input = document.getElementById("file-input");
  picker.style.display = "block";

  btn.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      picker.style.display = "none";
      showError(errorMessage("too_large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      picker.style.display = "none";
      status.style.display = "block";
      loadBuffer(reader.result, file.name);
    };
    reader.onerror = () => {
      picker.style.display = "none";
      showError(errorMessage("read_failed"));
    };
    reader.readAsArrayBuffer(file);
  });
}

// --- Entry point ---
const source = params.get("source");
const key = params.get("key");

if (source === "local") {
  setupLocalFilePicker();

} else if (source === "session" && key) {
  chrome.storage.session.get(key, (result) => {
    const marcFile = result[key];
    if (!marcFile) {
      showError(errorMessage("missing_key"));
      return;
    }
    chrome.storage.session.remove(key);
    try {
      const binary = atob(marcFile.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      loadBuffer(bytes.buffer, marcFile.name);
    } catch (e) {
      console.warn("Decode failed:", e);
      showError(errorMessage("decode_failed"));
    }
  });

} else if (source === "error") {
  const code = params.get("code") || "network";
  showError(
    "Kunde inte hämta filen: " + errorMessage(code),
    code === "permission_denied"
      ? null
      : "Kontrollera att servern svarar och tillåter cross-origin requests."
  );

} else {
  showError(errorMessage("no_source"));
}
