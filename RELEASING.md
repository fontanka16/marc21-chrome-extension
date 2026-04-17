# Release checklist

## Inför release

1. [ ] Alla tester gröna (`npm test`)
2. [ ] `manifest.json` version uppdaterad
3. [ ] `CHANGELOG.md` uppdaterad (flytta `[Unreleased]`-innehåll till ny versionssektion)
4. [ ] Manuellt testat mot Libris `_compilemarc`
5. [ ] Manuellt testat mot en `.mrc`-fil från annan källa
6. [ ] Inga tillfälliga debug-`console.log`/`console.debug` kvar (legitima `console.warn`/`console.error` för felhantering är OK)

## Bygg paketet

```sh
npm run build:zip
```

Scriptet läser versionen ur `manifest.json` och skriver `dist/marc21-viewer-X.Y.Z.zip`. Zippen innehåller endast de filer som Chrome behöver (`manifest.json`, JS, HTML, `icons/`, `LICENSE`) — inga tester, ingen testdata, ingen `package.json`.

Verifiera innehållet innan uppladdning:

```sh
unzip -l dist/marc21-viewer-*.zip
```

## Tagga och publicera

7. [ ] Commita version- och changelog-ändringar
8. [ ] Tagga: `git tag -a vX.Y.Z -m "Release X.Y.Z"` och `git push --tags`
9. [ ] Ladda upp `dist/marc21-viewer-X.Y.Z.zip` i [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
10. [ ] Fyll i CWS-formulärets "What's new"-fält med changelog-utdraget
