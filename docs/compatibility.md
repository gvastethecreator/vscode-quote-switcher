# Compatibility

Quote Switcher uses only stable VS Code editor, command, selection, configuration, and message APIs. Its core and extension bundle have no Node runtime dependency.

| Environment | Contract | Evidence gate |
| --- | --- | --- |
| VS Code Desktop | Full | Extension Host command, multi-cursor, selection, and undo suite |
| VS Code Web | Full | Official web-host run in a writable virtual filesystem |
| Virtual Workspace | Full | Web-host fixture plus writable non-file URI desktop fixture |
| Restricted Mode | Full | Manifest capability plus no task, filesystem, process, or workspace execution dependency |
| Remote/WSL/SSH/Codespaces | Full | `extensionKind: ["ui", "workspace"]`; URI-independent in-memory behavior |
| Windows, Linux, macOS | Full | Hosted Extension Host matrix after publication branch push |

CI tests VS Code `1.134.0`, current stable, and Insiders where applicable. The local release gate also installs the VSIX in a clean VS Code profile; hosted operating-system results remain a merge gate and are not inferred from Windows-only local execution.
