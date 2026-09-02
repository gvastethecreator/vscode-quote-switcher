# Security, privacy, and performance review

Review date: 2026-09-02
Release: `0.1.0`

## Data flow

The extension activates only for contributed commands. A command reads the active document into memory, scans it locally, plans bounded edits, and sends one edit to VS Code. It does not read other documents or workspace files.

There is no runtime network, filesystem, process, shell, storage, telemetry, logger, output channel, native module, or dependency. Document text, selections, paths, and decoded values are not persisted or logged.

## Input boundaries

- command arguments must be empty;
- language id must be one of four exact supported ids;
- active document length is capped at 8 MiB;
- cursor/selection count is capped at 4,096;
- collected literal count is capped at 100,000;
- configuration arrays are bounded, filtered, and deduplicated;
- every cursor/selection must resolve to a safe literal;
- target ranges must not overlap;
- all targets are validated before any edit;
- malformed escapes, legacy octal, line continuations, active interpolation, tagged templates, and directive-risk conversions are rejected;
- generated source is decoded again and must equal the original value.

Normal rejection paths show one concise message and include no source content.

## Threat review

| Threat | Control |
| --- | --- |
| Secret leakage | No network, telemetry, source logging, or persistence |
| Source execution | No `eval`, dynamic import, parser execution, task, terminal, or shell |
| Regex denial of service | Linear scanner; no workspace-controlled regex |
| Escape confusion | Manual bounded decoder plus decode-after-encode equality |
| Partial multi-cursor mutation | All-or-nothing planning and one editor edit |
| Hostile overlaps | Duplicate ranges deduplicated; nested/overlapping targets rejected |
| Oversized active document | 8 MiB command limit and explicit message |
| Adversarial token or cursor count | 100,000-literal and 4,096-selection limits |
| Invalid external invocation | Non-empty command argument list rejected |
| Package expansion | Strict files allowlist and VSIX archive inspection |

## Dependency review

Production dependencies: none. Build/test dependencies are lockfile-pinned by pnpm. Install scripts are limited to esbuild, Sharp, and the Playwright Chromium package used by official web-host tests; optional signing/keychain scripts remain disabled.

## Measured local evidence

On the Windows release workstation, the scanner completed a warmed 96 KiB fixture in under 20 ms, 1 MiB under 250 ms, 5 MiB under 1.2 seconds, and a pathological comment/backslash fixture under 250 ms. Both minified runtime bundles must remain below 250 KiB. Exact timings are printed by `pnpm run test:performance` in each run.

The package inspector rejects source maps, source/tests/scripts, node_modules, runtime network/process surfaces, missing artifacts, oversized bundles, and media without transparent corners.
