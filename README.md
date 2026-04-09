# Note

Note is a local desktop app that looks like a simple memo app on the surface, but lets the owner use one hidden trigger note to open protected tools for locking or restoring selected files and folders.

## What the current MVP does

- shows a normal note workspace
- sets a password once on first launch
- hides the protected tools behind one ordinary-looking note
- lets the owner lock a file or folder from the protected note area
- restores the locked item back to its original path on unlock
- packages a single portable Windows EXE through GitHub Actions

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

## Build the portable Windows EXE locally

```bash
npm run dist:win
```

Expected output:

```bash
release/Note-Portable-0.1.0.exe
```

## GitHub Actions build

The repository includes a Windows workflow at:

```bash
.github/workflows/windows-build.yml
```

It runs on `windows-latest`, installs dependencies, runs lint and tests, then builds the portable EXE and uploads it as an artifact named `Note-Portable`.

## Current security boundary

This MVP is designed to stop casual local access, not advanced attackers, malware, or forensic analysis. The password is stored plainly in local app state for simplicity in this version, the trigger note unlocks the protected tools when its saved body matches that password, and locked items are restored to their original path on unlock.
