const MENU_ID = "open-in-marc-viewer";
const LIBRIS_HOST = "libris.kb.se";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const SESSION_KEY_PREFIX = "marcFile:";
const SESSION_KEY_TTL_MS = 5 * 60 * 1000;

const TARGET_URL_PATTERNS = [
  "*://*/*.mrc",
  "*://*/*.marc",
  "file:///*.mrc",
  "file:///*.marc",
  "*://libris.kb.se/*_compilemarc*"
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "Öppna i MARC21 Viewer",
      contexts: ["link"],
      targetUrlPatterns: TARGET_URL_PATTERNS
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const url = info.linkUrl;
  if (!url) return;

  try {
    await ensureHostPermission(url);

    const response = await fetch(url, {
      credentials: isLibrisUrl(url) ? "include" : "omit"
    });
    if (!response.ok) throw makeError("http_error");

    const declaredSize = parseInt(response.headers.get("Content-Length") || "0", 10);
    if (declaredSize && declaredSize > MAX_FILE_SIZE) throw makeError("too_large");

    const buffer = await response.arrayBuffer();

    if (buffer.byteLength === 0) throw makeError("empty");
    if (buffer.byteLength > MAX_FILE_SIZE) throw makeError("too_large");

    await cleanupStaleSessions();

    const base64 = arrayBufferToBase64(buffer);
    const name = deriveFilename(url);
    const key = SESSION_KEY_PREFIX + Date.now() + ":" + Math.random().toString(36).slice(2, 8);

    await chrome.storage.session.set({
      [key]: { name, data: base64, created: Date.now() }
    });

    const viewerUrl = chrome.runtime.getURL("viewer.html") + "?source=session&key=" + encodeURIComponent(key);
    chrome.tabs.create({ url: viewerUrl });

  } catch (e) {
    const code = e && e.code ? e.code : "network";
    const viewerUrl = chrome.runtime.getURL("viewer.html") + "?source=error&code=" + encodeURIComponent(code);
    chrome.tabs.create({ url: viewerUrl });
  }
});

function makeError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}

function isLibrisUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === LIBRIS_HOST || u.hostname.endsWith("." + LIBRIS_HOST);
  } catch {
    return false;
  }
}

async function ensureHostPermission(url) {
  let origin;
  try {
    const u = new URL(url);
    if (u.protocol === "file:") {
      origin = "file:///*";
    } else {
      origin = `${u.protocol}//${u.hostname}/*`;
    }
  } catch {
    throw makeError("invalid_url");
  }

  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return;

  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) throw makeError("permission_denied");
}

async function cleanupStaleSessions() {
  const all = await chrome.storage.session.get(null);
  const now = Date.now();
  const toRemove = [];
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(SESSION_KEY_PREFIX)) continue;
    if (!value || typeof value.created !== "number" || (now - value.created) > SESSION_KEY_TTL_MS) {
      toRemove.push(key);
    }
  }
  if (toRemove.length) await chrome.storage.session.remove(toRemove);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function deriveFilename(url) {
  const idMatch = url.match(/[?&]id=([^&]+)/i);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const last = id.split("/").filter(Boolean).pop() || "post";
    return last + ".mrc";
  }
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {}
  return "post.mrc";
}
