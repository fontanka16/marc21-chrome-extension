const MENU_ID = "open-in-marc-viewer";

const TARGET_URL_PATTERNS = [
  "*://*/*.mrc",
  "*://*/*.marc",
  "file:///*.mrc",
  "file:///*.marc",
  "*://*/_compilemarc",
  "*://*/_compilemarc*",
  "*://*/*_compilemarc",
  "*://*/*_compilemarc*"
];

// Kör vid installation och uppdatering så menyn alltid är konsistent
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
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const buffer = await response.arrayBuffer();

    if (buffer.byteLength === 0) {
      throw new Error("Servern returnerade en tom fil");
    }

    // Koda som base64 för lagring (session storage stödjer bara serialiserbara värden)
    const base64 = arrayBufferToBase64(buffer);
    const name = deriveFilename(url);
    const key = "marcFile:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8);

    await chrome.storage.session.set({ [key]: { name, data: base64 } });

    const viewerUrl = chrome.runtime.getURL("viewer.html") + "?source=session&key=" + encodeURIComponent(key);
    chrome.tabs.create({ url: viewerUrl });

  } catch (e) {
    const viewerUrl = chrome.runtime.getURL("viewer.html")
      + "?source=error&msg=" + encodeURIComponent(e.message || String(e));
    chrome.tabs.create({ url: viewerUrl });
  }
});

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000; // undvik stack overflow för stora filer
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function deriveFilename(url) {
  // För _compilemarc-URLer: använd id-parametern
  const idMatch = url.match(/[?&]id=([^&]+)/i);
  if (idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const last = id.split("/").filter(Boolean).pop() || "post";
    return last + ".mrc";
  }
  // Annars: sista segmentet i pathen
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last) return decodeURIComponent(last);
  } catch {}
  return "post.mrc";
}
