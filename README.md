# Note

Note is a local desktop app that looks like a simple note app on the surface, but lets the owner open one protected note, enter a password, and then lock or restore selected files and folders.

## What the current MVP does

- shows a normal note workspace
- keeps one protected note behind a password
- lets the owner lock a file or folder from the protected note area
- restores the locked item back to its original path on unlock
- packages a Windows installer through GitHub Actions

## Local development

```bash
npm install
npm run dev
```

## Local validation

```bash
npm run lint
npm run build
npm run test
```

## Build the Windows installer locally

```bash
npm run dist:win
```

Expected output:

```bash
release/Note-Setup-0.1.0.exe
```

## GitHub Actions build

The repository includes a Windows workflow at:

```bash
.github/workflows/windows-build.yml
```

It runs on `windows-latest`, installs dependencies, runs lint and tests, then builds the NSIS installer and uploads it as an artifact named `Note-Setup`.

## Current security boundary

This MVP is designed to stop casual local access, not advanced attackers, malware, or forensic analysis. The protected note gates management actions, and locked items are restored to their original path on unlock.
