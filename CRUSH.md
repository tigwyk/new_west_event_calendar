# CRUSH.md

This file provides best practices and essential commands for agentic coding in this repository. Follow these rules for editing, formatting, and operating on the codebase:

## Commands

- **Dev:** `bun run dev` (starts Next.js dev server with Bun runtime)
- **Build:** `bun run build` (builds the Next.js app with Bun)
- **Start:** `bun run start` (starts production server with Bun)
- **Lint:** `bun run lint` (runs ESLint with Bun)
- **Install:** `bun install` (installs dependencies with Bun package manager)
- **Test:** `bun test` (runs comprehensive validation and security tests)
- _Update this file as the repo evolves._

## Code Style Guidelines

- **Security:** All user inputs are sanitized and validated. Rate limiting prevents spam. Error boundaries handle crashes gracefully.
- **Performance:** Uses React.useMemo and useCallback for expensive operations. Optimized filtering and sorting.
- **Accessibility:** Proper ARIA labels, semantic HTML, keyboard navigation support.
- **SEO:** Comprehensive meta tags, Open Graph, Twitter cards, PWA manifest.
- **Theming:** Uses New Westminster official colors (#003149 primary, #c94927 accent).
- **Imports:** Order: standard library, installed packages, internal modules. Use absolute imports when possible. Remove unused imports.
- **Formatting:** Use consistent indentation (2 or 4 spaces; match existing code). Keep line length reasonable (≤ 100 chars preferred). No trailing whitespace.
- **Types:** Use types and interfaces for all complex data structures if TypeScript/inferred if Python.
- **Naming:**
  - Variables/functions: `camelCase`
  - Classes/types: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Error Handling:** Use idiomatic error handling (try/except, Result, or callbacks as appropriate). Don’t expose raw errors to users. Log with appropriate context.
- **Documentation:** Add docstrings or comments for exported functions and all complex logic (if necessary). Keep this minimal unless asked.
- **File organization:** One component/class per file. Filename matches main class/component when possible.
- **Commit messages:** Explain the reason for the change, not just what changed. Use present tense and keep concise.

## Housekeeping
- Do not commit API keys or secrets. Use a `.env` file for environment variables if needed.
- Add `.crush` to `.gitignore` if not present.
- Update CRUSH.md with any new conventions, commands, or style policies as the project evolves.

---
_Last updated 2025-08-16._
