# Changelog

Alla noterbara ändringar i detta projekt dokumenteras här.

Formatet följer [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/) och projektet använder [Semantic Versioning](https://semver.org/lang/sv/).

## [Unreleased]

## [1.0.0] – 2026-04-17

### Added
- Första publika versionen av MARC21 Viewer.
- Kontextmenypost "Öppna i MARC21 Viewer" för `.mrc`- och `.marc`-länkar samt Libris `_compilemarc`-länkar.
- MARC21-parser enligt ISO 2709 (`marc-parser.js`) — hanterar kontrollfält, datafält, indikatorer och delfält.
- Uppslagstabell för de vanligaste MARC21-fälten (`marc-labels.js`).
- Visningsvy med expanderbara poster, sök i taggnummer/etiketter/värden och paginering (20 poster/sida).
- Automatiska tester via Nodes inbyggda testrunner (enhetstester för parsern + fixtures mot `testdata/`).
- GitHub Actions-workflow som kör testerna vid varje push och pull request.

[Unreleased]: https://github.com/fontanka16/marc21-chrome-extension/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/fontanka16/marc21-chrome-extension/releases/tag/v1.0.0
