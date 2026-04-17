# Privacy Policy – MARC21 Viewer

_Senast uppdaterad: 2026-04-17_

MARC21 Viewer samlar inte in, lagrar inte permanent, transmitterar inte och delar inte några personuppgifter eller användardata.

## Vad tillägget gör

- När du högerklickar på en länk till en MARC-fil (`.mrc`, `.marc` eller Libris `_compilemarc`) och väljer "Öppna i MARC21 Viewer" hämtar tillägget filen från den URL du valt.
- Filen tolkas och visas i en lokal flik. All bearbetning sker i din webbläsare.
- Tillägget skickar inte data till några externa servrar utöver den ursprungliga hämtningen från den URL du själv klickade på.

## Data som hanteras

| Datatyp | Hur den hanteras |
|---|---|
| Hämtad MARC-fil | Bearbetas i minnet och visas i viewer-fliken. Sparas inte på disk. |
| Temporär överföring mellan bakgrunds-worker och viewer | `chrome.storage.session` används som kortlivad buffer. Posten raderas automatiskt så fort viewern har läst den, och `session`-storage rensas när webbläsarsessionen avslutas. |

## Vad tillägget **inte** gör

- Ingen analytics, telemetri eller spårning.
- Ingen inloggning, inga konton, inga cookies.
- Ingen kommunikation med tredjepartsservrar.
- Ingen synkronisering mellan enheter.

## Permissions – motivering

- **`contextMenus`** – för att lägga till menyvalet "Öppna i MARC21 Viewer".
- **`storage`** – för `chrome.storage.session` som temporär buffer (se ovan).
- **`<all_urls>`** – för att kunna hämta MARC-filer från den URL du högerklickar på, oavsett domän.

## Kontakt

Frågor eller kommentarer: öppna ett ärende på <https://github.com/fontanka16/marc21-chrome-extension/issues>.
