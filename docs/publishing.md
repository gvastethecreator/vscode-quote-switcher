# Publishing Quote Switcher

Extension id: `gvastethecreator.quote-switcher`.

Publication is not part of ordinary implementation. It requires explicit authorization after the exact candidate commit, VSIX hash, listing text, target registries, tag, and release mutations are shown.

The **Release** workflow starts from **Actions → Release → Run workflow**. Default input `artifact-only` does not publish.

## Build the candidate

```bash
pnpm install --frozen-lockfile
pnpm run quality
pnpm run test:integration
pnpm run test:web
pnpm run vsix
pnpm run inspect:vsix
pnpm run test:vsix
```

The candidate is `quote-switcher.vsix`. `vsce` runs `vscode:prepublish`, so the packaged Node and web bundles are rebuilt from the checked source.

## GitHub Actions

1. Run **Release** with `artifact-only` from `main`.
2. After approval, run one of `github-release`, `vscode-marketplace`, or `open-vsx`.
3. Run one registry at a time.

Environments `github-release`, `vscode-marketplace`, and `open-vsx` accept `main` only. Do not store `VSCE_PAT` or `OVSX_PAT` until the owner asks to publish.

## Required approval preview

Before publishing, record:

- source commit and clean-tree state;
- SHA-256 and byte size of the frozen VSIX;
- Marketplace and Open VSX listing copy;
- target version, tag, and release notes;
- exact commands and registries to mutate;
- publisher/account readiness without exposing credentials.

After approval, publish the frozen bytes without rebuilding. Install each public artifact in desktop and web environments, verify the advertised commands, then compare its hash or package contents with the candidate.

Do not delete the release branch, create a tag, publish a release, or mutate a registry as a side effect of package verification.

## Manual fallback

Marketplace: upload the exact verified VSIX at [Marketplace management](https://marketplace.visualstudio.com/manage).

Open VSX:

```powershell
pnpm exec ovsx publish .\quote-switcher.vsix -p $env:OVSX_PAT
```

Never place a PAT in a command, an issue, a log, or a document.

## Rollback

Prefer a forward patch. Do not rewrite a public tag or replace bytes under an existing version.
