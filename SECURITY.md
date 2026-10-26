# Security

Quote Switcher is local-only. It reads the active document in memory only when a command runs. It does not scan the workspace, access the filesystem, execute source, make network requests, log source text, store document content, or use telemetry.

Malformed and unsupported literals are rejected before edits. The extension never uses `eval` or workspace-controlled regular expressions. See [the security review](docs/security-review.md) for the release threat model and verification.

Report vulnerabilities through a [private GitHub security advisory](https://github.com/gvastethecreator/vscode-quote-switcher/security/advisories/new). Do not open a public issue with exploit details.
