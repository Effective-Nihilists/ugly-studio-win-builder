# ugly-studio-win-builder

Windows installer builder for [Ugly Studio](https://ugly.bot/studio). This
repository exists solely to run `electron-builder --win` on GitHub's
free public-repo Actions quota. It is intentionally minimal — no source
code, no build logic. All it does:

1. Receive an encrypted tarball URL via `workflow_dispatch` input
2. Download + decrypt the tarball
3. Run `electron-builder --win --x64`
4. Publish the resulting `.exe` as a GitHub Release

## Why a separate repo?

The main ugly-studio source lives in a private repo. Private-repo Actions
are metered (2000 minutes/month free, then billed). Public-repo Actions
are unlimited and free. This repo is a public executor for the Windows
build step — the private repo pushes encrypted inputs here, the public
repo builds, and the `.exe` ends up in GitHub Releases for pickup by
the private repo's publish pipeline (which uploads to R2 / updates
`studio-latest.json`).

## Security

- The **source tarball is encrypted** (AES-256-GCM) with a key shared
  only between this repo and the private repo (`WIN_BUILD_ENCRYPTION_KEY`
  secret in both places). Decryption happens inside the runner.
- The **tarball URL** is a short-lived (15 min) R2 presigned URL. By
  the time workflow logs are visible the URL is already expired.
- The produced `.exe` is published to Releases on this public repo.
  Anyone can download it — which is the point; it's the same artifact
  that ends up on ugly.bot's public download page anyway.

## Triggering

Normally triggered from the private repo by `scripts/windows-release.ts`.
Manual testing via the Actions tab → "Build Windows Installer" → "Run
workflow" with a valid `tarball_url` + `version`.
