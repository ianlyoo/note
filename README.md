# Note

Note is a local desktop app that looks like a simple memo app on the surface, but lets the owner use one hidden trigger note to open protected tools for locking or restoring selected files and folders.

## What the current MVP does

- shows a normal note workspace
- sets a password once on first launch
- hides the protected tools behind one ordinary-looking note
- lets the owner lock a file or folder from the protected note area
- restores the locked item back to its original path on unlock
- packages a Windows zip bundle that contains the runnable app

## Local development

```bash
node -v  # Node 24+
npm install
npm run dev
```

## Local validation

```bash
npm run lint
npm run build
npm run test
```

## Build the Windows zip bundle locally

```bash
npm run dist:win
```

Expected output:

```bash
release/Note-Windows-0.1.0.zip
```

## GitHub Actions build

The repository includes a Windows workflow at:

```bash
.github/workflows/windows-build.yml
```

It runs on `windows-latest`, installs dependencies, runs lint and tests, then builds the Windows zip bundle and uploads it as an artifact named `Note-Windows-Zip`.

The workflow and local baseline now target Node 24.

## Current security boundary

This MVP is designed to stop casual local access, not advanced attackers, malware, or forensic analysis. The password is stored plainly in local app state for simplicity in this version, the trigger note unlocks the protected tools when its saved body matches that password, locked items are restored to their original path on unlock, and packaged builds keep their `userdata` folder beside the extracted app executable.
