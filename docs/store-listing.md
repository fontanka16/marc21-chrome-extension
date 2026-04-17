# Chrome Web Store – listing-text

Återanvändbar text för CWS Developer Dashboard. Kopiera in fält för fält vid ny release.

## Grunduppgifter

- **Namn**: MARC21 Viewer
- **Kategori**: Productivity (alternativ: Developer Tools)
- **Språk**: Svenska

## Kort beskrivning (≤132 tecken)

> Öppnar MARC21-poster (.mrc, .marc) och Libris _compilemarc-länkar i en läsbar vy direkt i webbläsaren.

## Detaljerad beskrivning

> MARC21 Viewer är ett Chrome-tillägg för bibliotekarier och andra som arbetar med bibliografiska MARC21-poster.
>
> **Funktioner**
> - Högerklicka på en MARC-länk och välj "Öppna i MARC21 Viewer"
> - Visar alla fält med taggnummer, etikett, indikatorer och delfält
> - Expandera och minimera enskilda poster
> - Sök i fältvärden, taggnummer och etiketter
> - Paginering (20 poster per sida)
> - Stöd för `.mrc`, `.marc` och Libris `_compilemarc`-länkar
>
> **Integritet**
> All tolkning sker lokalt i webbläsaren. Tillägget samlar inte in, lagrar eller skickar någon data till externa servrar.
>
> **Begränsningar**
> - Kräver att servern tillåter cross-origin requests (CORS)
> - Förutsätter UTF-8-kodad data; MARC-8 stöds inte
> - Fält-etiketter är tillgängliga för de vanligaste MARC21-fälten
>
> Källkoden finns på GitHub: https://github.com/fontanka16/marc21-chrome-extension

## Single-purpose-motivering

> Tillägget har ett syfte: att visa MARC21-bibliografiska poster i en läsbar vy.

## Permission justifications

| Permission | Motivering |
|---|---|
| `contextMenus` | Lägger till menyvalet "Öppna i MARC21 Viewer" i högerklickmenyn på länkar som matchar MARC-mönster. |
| `storage` | Temporär överföring av hämtad fildata mellan bakgrunds-worker och viewer-flik via `chrome.storage.session`. Rensas direkt efter läsning. |
| `host_permissions` (`<all_urls>`) | Tillåter hämtning av MARC-filer från godtyckliga URL:er som användaren själv väljer genom att högerklicka på en länk. Tillägget kör inte innehållsskript på några sidor. |

## Privacy policy URL

```
https://github.com/fontanka16/marc21-chrome-extension/blob/main/PRIVACY.md
```

## Screenshots

- [docs/screenshots/1-cws.png](screenshots/1-cws.png) (1280×800)
- [docs/screenshots/2-cws.png](screenshots/2-cws.png) (1280×800)

## What's new-text (fylls i vid varje uppdatering)

Hämta från `CHANGELOG.md` – innehållet under den nya versionens sektion.
