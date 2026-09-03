<div align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher"><img src="media/icon.png" alt="Quote Switcher" width="128" /></a>

# Quote Switcher

**Change quote style without changing the represented string value.**

<p align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher"><img alt="GitHub" src="https://shieldcn.dev/badge/github.png?variant=outline&size=xs&theme=blue&logo=github" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://shieldcn.dev/github/license/gvastethecreator/vscode-quote-switcher.png?variant=outline&size=xs" /></a>
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher/actions/workflows/ci.yml"><img alt="CI status" src="https://shieldcn.dev/github/ci/gvastethecreator/vscode-quote-switcher.png?workflow=ci.yml&branch=main&variant=outline&size=xs" /></a>
</p>
</div>

<img src="media/preview.png" alt="Quote Switcher before and after converting three TypeScript strings" width="100%" />

## Highlights

- Cycle single, double, and template quotes in JavaScript and TypeScript.
- Convert JSON and JSONC strings safely to double quotes.
- Handle multiple cursors in one edit and one undo step.
- Preserve the decoded string value or leave the source unchanged.

## Use

Place cursors inside string literals, then run **Quote Switcher: Cycle Quotes**. Direct conversion commands are also available from the Command Palette.

The extension ignores comments, regex literals, unsafe templates, malformed strings, and selections that cross literal boundaries. It has no telemetry, network access, filesystem access, or stored document content.

More details: [product contract](docs/PDR.md) · [compatibility](docs/compatibility.md) · [security](docs/security-review.md)

---

<p align="center">
  <a href="https://github.com/gvastethecreator/vscode-quote-switcher/stargazers"><img alt="GitHub stars" src="https://shieldcn.dev/github/stars/gvastethecreator/vscode-quote-switcher.png?variant=outline&size=xs" /></a>
  <a href="https://github.com/gvastethecreator"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/follow%20me-/gvastethecreator.png?size=xs&amp;logo=github&amp;brand=github&amp;mode=dark"><img alt="Follow gvastethecreator" src="https://shieldcn.dev/badge/follow%20me-/gvastethecreator.png?size=xs&amp;logo=github&amp;brand=github&amp;mode=light"></picture></a>
  <a href="https://github.com/sponsors/gvastethecreator"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/support%20this-project.png?size=xs&amp;logo=ri%3APiHeartFill&amp;logoColor=b85a90&amp;brand=github&amp;mode=dark"><img alt="Support this project" src="https://shieldcn.dev/badge/support%20this-project.png?size=xs&amp;logo=ri%3APiHeartFill&amp;logoColor=b85a90&amp;brand=github&amp;mode=light"></picture></a>
</p>
