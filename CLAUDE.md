# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run build:css        # Compile SCSS → expanded cyberpunk.css
npm run build:css:min    # Compile SCSS → minified cyberpunk.min.css
npm run scss:watch       # Watch SCSS and auto-compile to minified
npm run lint:css         # Stylelint all SCSS files
npm test                 # Jest unit tests (--runInBand)
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Playwright end-to-end tests
npm run pug:watch        # Watch/compile Pug templates to HTML
```

Coverage thresholds are enforced at 70–80% globally (branches/functions/lines/statements).

## Architecture

### SCSS Entry Point
`scss/cyberpunk.scss` composes all partials via Sass `@use` in this load order:

1. **Core** — `_fonts.scss`, `_variables.scss`, `_mixins.scss`
2. **Base** — `_reset.scss`, `_base.scss`, `_colors.scss`, `_typography.scss`
3. **Components** — `_buttons.scss`, `_components.scss`, `_modal.scss`, `_toast.scss`, `_navbar.scss`, `_windows.scss`, `_netgraph.scss`
4. **Effects/layout** — `_crt.scss`, `_layout.scss`, `_code.scss`, `_terminal.scss`, `_hex.scss`

### Design Token Layer (`scss/_variables.scss`)
All variables are declared with `!default` so consumers can override before importing. Covers color palette, breakpoints (XS 360px → XL 1300px), spacing scale (xxs 0.25rem → xxl 4rem), typography, z-index levels, transitions, and per-component variables.

### Theme System (`scss/_colors.scss`)
Two built-in palettes: `cyberpunk` (default) and `matrix`. Access colors via the `cp-color($key)` function. The `theme-variables()` mixin switches CSS custom properties at `:root`. Utility classes `.bg-*` and `.txt-*` are auto-generated from the active palette.

### Key Mixins (`scss/_mixins.scss`)
- `retro-border()` — CRT-style glowing border
- `retro-glow-text()` — neon text glow
- `crt-scanlines` — scanline overlay
- `grid-bg()` — retro grid background

### JavaScript Modules (`scripts/`)
Each file is a standalone ES module with a matching Jest test suite in `tests/`. `init.js` is the entry point and is excluded from coverage. Modules: `buttons`, `modals`, `toasts`, `navbar`, `hexviewer`, `netgraph`, `sfx`.

### Output Files
Compiled CSS is committed to the repo root (`cyberpunk.css`, `cyberpunk.min.css`, and their source maps). Always rebuild after editing SCSS.
