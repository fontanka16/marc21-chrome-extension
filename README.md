# MARC21 Viewer

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](manifest.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tests](https://github.com/fontanka16/marc21-chrome-extension/actions/workflows/test.yml/badge.svg)](https://github.com/fontanka16/marc21-chrome-extension/actions/workflows/test.yml)

Ett Chrome-tillägg som öppnar MARC21-poster i en läsbar vy. Stödjer `.mrc`- och `.marc`-filer samt Libris `_compilemarc`-länkar.

## Funktioner

- **Högerklick på en MARC-länk** → "Öppna i MARC21 Viewer"
- **Vänsterklick på tilläggsikonen** → välj en lokal `.mrc`- eller `.marc`-fil
- Visar alla fält med taggnummer, etikett, indikatorer och delfält
- Expandera och minimera enskilda poster
- Sök i fältvärden, taggnummer och etiketter
- Paginering (20 poster per sida)
- Ingen extern kod – MARC21-parsern är inbyggd

## Installation (utvecklingsläge)

1. Gå till `chrome://extensions/`
2. Aktivera **Utvecklarläge** (toggle uppe till höger)
3. Klicka **"Läs in okomprimerat tillägg"**
4. Välj den här mappen

## Användning

**Från en länk:** Högerklicka på en länk som slutar på `.mrc` eller `.marc`, eller som innehåller `_compilemarc` (Libris), och välj **"Öppna i MARC21 Viewer"**. En ny flik öppnas med posten.

**Från en lokal fil:** Klicka på tilläggsikonen i verktygsfältet. En ny flik öppnas med en filväljare där du kan välja en `.mrc`- eller `.marc`-fil från din dator (max 20 MB).

## Begränsningar

- Kräver att servern tillåter cross-origin requests (CORS). Om servern blockerar visas ett felmeddelande.
- Förutsätter UTF-8-kodad data. MARC-8-kodning stöds inte.
- Fält-etiketter är tillgängliga för de vanligaste MARC21-fälten; okända fält visas med enbart sitt taggnummer.

## Filer

- `manifest.json` – tilläggskonfiguration
- `background.js` – service worker som hanterar kontextmenyn och hämtar filer
- `viewer.html`, `viewer.js` – användargränssnittet
- `marc-parser.js` – MARC21-parser enligt ISO 2709
- `marc-labels.js` – uppslagstabell för fält-etiketter
- `icons/` – tilläggsikoner

## Integritet

Tillägget samlar inte in någon användardata – se [PRIVACY.md](PRIVACY.md).

## Licens

MIT – se `LICENSE`.
