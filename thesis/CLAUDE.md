# CLAUDE.md - Thesis

This file provides guidance to Claude Code when working on this master's thesis.

## Rules

### 1. Language & script

The thesis is written in **Serbian**, and the final rendered output must be in
**Serbian Cyrillic (ћирилица)**.

We use Isidora's approach: **source is typed in Latin/ASCII** and a font mapping
(`ascii-to-serbian.tec`, applied via `Mapping=ascii-to-serbian` in `main.tex`)
converts it to Cyrillic glyphs on output. So:

- Type Latin in the `.tex` files: `Dokaz`, `znanje`, `sistem`.
- Use LaTeX accent commands for Serbian letters: `\v c` (č), `\' c` (ć),
  `\v s` (š), `\v z` (ž), `\dj` (đ). Direct Unicode `č/ć/š/ž/đ` also works.
- English terms/names stay Latin via `\textenglish{...}` (e.g. `\textenglish{Ethereum}`).
- Compile with **XeLaTeX + biber** (fontspec/polyglossia require XeTeX).
