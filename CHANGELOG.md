# Changelog

Alla noterbara ändringar i detta projekt dokumenteras här.

Formatet följer [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/) och projektet använder [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

## [1.1.0] – 2026-04-19

### Security
- `host_permissions` smalnat från `<all_urls>` till `*://libris.kb.se/*`; övriga domäner aktiveras via `optional_host_permissions` och en runtime-prompt eller manuellt under Inställningar → Tillägg → Webbplatsåtkomst.
- `credentials: "include"` skickas bara till Libris; övriga hostar hämtas med `credentials: "omit"`.
- `targetUrlPatterns` för `_compilemarc` låst till `libris.kb.se` — angripare kan inte längre trigga menyn via godtycklig URL med `_compilemarc` i sökvägen.
- `web_accessible_resources`-blocket borttaget (resurserna behöver inte vara webbtillgängliga).
- 20 MB-tak på hämtade filer (via `Content-Length` och faktisk storlek).
- Automatisk städning av `marcFile:`-nycklar äldre än 5 minuter i `chrome.storage.session`.
- Felmeddelanden via URL byttes från rå `e.message` till fasta felkoder; `innerHTML` ersatt med `textContent`/`createElement` i hela viewern.

### Changed
- Tilläggets beskrivning förtydligar att fler domäner kan aktiveras via tilläggets inställningar.

## [1.0.0] – 2026-04-17

### Added
- Första publika versionen av MARC21 Viewer.
- Kontextmenypost "Öppna i MARC21 Viewer" för `.mrc`- och `.marc`-länkar samt Libris `_compilemarc`-länkar.
- MARC21-parser enligt ISO 2709 (`marc-parser.js`) — hanterar kontrollfält, datafält, indikatorer och delfält.
- Uppslagstabell för de vanligaste MARC21-fälten (`marc-labels.js`).
- Visningsvy med expanderbara poster, sök i taggnummer/etiketter/värden och paginering (20 poster/sida).
- Automatiska tester via Nodes inbyggda testrunner (enhetstester för parsern + fixtures mot `testdata/`).
- GitHub Actions-workflow som kör testerna vid varje push och pull request.

[Unreleased]: https://github.com/fontanka16/marc21-chrome-extension/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/fontanka16/marc21-chrome-extension/releases/tag/v1.1.0
[1.0.0]: https://github.com/fontanka16/marc21-chrome-extension/releases/tag/v1.0.0
