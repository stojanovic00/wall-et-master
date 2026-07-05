# CLAUDE.md - Thesis

This file provides guidance to Claude Code when working on this master's thesis.

---

## Project state

- **Chapter 1 - Uvod** (`0uvod.tex`): COMPLETE, APPROVED
- **Chapter 2 - Osnove i srodna resenja** (`1osnovniKoncepti.tex`): COMPLETE, awaiting user approval
- **Chapter 3 - Implementacija** (`2implementacija.tex`): NEXT TO WRITE
- **Chapter 4 - Zakljucak** (`zakljucak.tex`): After chapter 3

Workflow: write one chapter → user approves → proceed to next.

---

## Build

Always use the full 4-step build. Run from `thesis/`:

```bash
rm -f main.aux main.bcf main.bbl main.blg && \
xelatex -interaction=nonstopmode main.tex && \
biber main && \
xelatex -interaction=nonstopmode main.tex && \
xelatex -interaction=nonstopmode main.tex
```

Check for errors with `grep "^!" main.log`. If you get "Extra }, or forgotten \endgroup", delete `main.aux` and re-run.

---

## Language and script

The thesis is written in **Serbian Cyrillic** output, with **Latin ASCII source**.

- The `Mapping=ascii-to-serbian` font setting (in `main.tex`) converts Latin to Cyrillic on output automatically.
- Type Latin in `.tex` files: `sistem`, `Ethereum`, `blockchain`.
- Serbian diacritics: `\v c` (č), `\' c` (ć), `\v s` (š), `\v z` (ž), `\dj` (đ). Unicode diacritics also work but prefer LaTeX commands.
- **Compile with XeLaTeX + biber** (fontspec/polyglossia require XeTeX).

---

## Macros

```latex
\newcommand{\en}[1]{\textit{\textenglish{#1}}}
```

- `\en{...}` - for ALL non-Serbian words (English terms, abbreviations, product names). Gives italic + Latin font (prevents ascii-to-serbian mapping).
- `\texttt{...}` - for code tokens only (monospace, NOT italic). Example: `\texttt{approve()}`, `\texttt{0xef0100}`.
- `\textenglish{...}` - ONLY in the page header in `main.tex`. Everywhere else use `\en{}`.

**In section titles:** close `\en{}` with an empty group to prevent font leaking:
```latex
\section{\en{EIP-7702}{}: delegacija koda za \en{EOA}}
```

---

## Writing style rules

These rules were explicitly established by the user - do not violate them:

1. **No semicolons** anywhere in thesis prose. Use a period or comma instead.
2. **No em dashes** anywhere. Use a regular hyphen `-` instead.
3. **No "kompromitacija"** - use `kompromitovanje`.
4. **No "rasporedjuje"** for deploying contracts - use `objavljuje`.
5. **No "pohranjen"** - use `trajno zapisan`.
6. **No "gasna naknada"** - use `gas` or `tro\v skovi izvr\v savanja transakcije`.
7. **No "bezstanjevan"** - not a real Serbian word. Say `ugovor koji ne sme imati logiku koja zahteva \v cuvanje stanja (\en{stateless contract})`.
8. **"trofazni"** - written as one word without a hyphen.
9. **First use of a technical term**: introduce with English in parentheses - example: `delegacijski ozna\v civa\v c (\en{delegation designator})`.
10. **"pametni" (smart account context)**: put in Serbian quotes - `"pametni"`.
11. **\cite{key1,key2}**: NO space between keys. A space causes wrong Cyrillic output (`[накамото2008, 2]` instead of `[1, 2]`).
12. References must be specific and non-vague. Never cite just a docs homepage if a whitepaper or EIP page exists.

---

## Bibliography

All entries in `references.bib` must have `langid = {english}` so author names and titles stay Latin.

Current entries: `nakamoto2008`, `buterin2014`, `antonopoulos2018`, `wood2024`, `eip7`, `bip11`, `erc20`, `eip7702`, `eip4337`, `ethabi2024`, `solidity2024`, `gnosissafe2023`, `pectra2025`, `uniswap2021`, `permit2`, `chromemv32023`, `ethersjs2024`, `ledger2024`, `etherns2025`, `react2024`, `webpack2024`.

Note: `ledger2024` is referenced in `0uvod.tex` but the hardware wallet section was removed from `1osnovniKoncepti.tex`. Do NOT delete it without checking.

---

## Chapter 2 structure (for reference when writing Ch. 3)

`1osnovniKoncepti.tex` sections:
- 2.1 Blockchain i Ethereum - `\cite{nakamoto2008,buterin2014}`, EVM `\cite{wood2024}`, gas, EOA, ECDSA
- 2.2 Pametni ugovori - `\cite{buterin2014,wood2024}`, Solidity `\cite{solidity2024}`, ABI `\cite{ethabi2024}`
- 2.3 Visepotpisni protokoli - M-of-N `\cite{bip11}`, propose/sign/execute `\cite{gnosissafe2023}`
- 2.4 EIP-7702: delegacija koda za EOA - type-4 tx, authorization_list, delegation designator `0xef0100`, code slot, stateless constraint, revocation with ZeroAddress. `\cite{eip7702,pectra2025,eip7}`
- 2.5 EIP-7702 kao unapredjenje korisnickog iskustva - 3-phase flow + 2 diagrams (classic_flow, eip7702_flow)
- 2.6 Postojeca resenja i njihova ogranicenja - Gnosis Safe, EIP-4337, Permit2

---

## Diagrams

Mermaid diagrams live in `thesis/diagrams/*.mmd`. Render to PNG:

```bash
mmdc -i diagrams/NAME.mmd -o slike/NAME.png -s 5 -w 3000
```

- Write Cyrillic text directly in `.mmd` files (mmdc renders independently of LaTeX).
- `classic_flow.mmd`: messageMargin 80, scale 3, width 2400
- `eip7702_flow.mmd`: messageMargin 200, scale 5, width 3000, 3 colored rect phases

Full-width/full-page figure embed:
```latex
\begin{figure}[H]
  \centering
  \hspace*{-1.5cm}\includegraphics[width=\dimexpr\textwidth+3cm\relax, height=\textheight, keepaspectratio=false]{NAME}
  \caption{Caption in Serbian.}
\end{figure}
```

---

## Chapter 3 plan (Implementacija)

File: `2implementacija.tex`. Sections:

### 3.1 Arhitektura sistema
- Tech stack: React 18 + TypeScript + ethers.js v6 + Webpack 5 + Chrome MV3
- Provider pattern for state management (React Context + hooks)
- Screen-based navigation via `Screen` union type in `src/types/index.ts`
- MV3 components: popup (React app), service worker (background), `chrome.storage.local` (encrypted key persistence)
- Cite: `\cite{ethersjs2024,chromemv32023}`

### 3.2 Upravljanje novcanikom
- Key generation: `ethers.Wallet.createRandom()` and import from private key
- AES-256 encryption with crypto-js: `crypto.AES.encrypt(privateKey, password)`
- Password never stored - only SHA-256 hash kept for verification
- Decrypted key validated: `/^0x?[0-9a-fA-F]{64}$/`
- `chrome.storage.local` async API for persistence (localStorage fallback in dev)
- Code from `WalletProvider.tsx`

### 3.3 Visepotpisni ugovor
- `MultiSig.sol` - signers array, minSignatures threshold
- txHash = `keccak256(nonce, to, amount, token)` - unique transaction ID
- Propose/sign/execute flow with event `Propose(bytes32 txHash)`
- Deployment via `ethers.ContractFactory` from extension
- Code from `MultisigContractProvider.tsx`

### 3.4 EIP-7702 delegacija za depozit tokena
The 3-phase implementation (from `extension/src/utils/multisig.ts` and `WalletProvider.tsx`):
- **Faza 1 - setupDelegation()**: type-4 tx, sets delegation designator once; `isDelegationActive` persisted in `chrome.storage.local`
- **Faza 2 - depositTokenWithDelegation()**: regular type-2 tx, calls `approveAndDeposit()` on EOA address (which now has Approver code); atomic
- **Faza 3 - revokeDelegation()**: type-4 tx with `ZeroAddress`, clears designator
- Toggle in `WalletScreen.tsx` - "Smart Account (EIP-7702)" toggle
- `MultisigContractProvider.depositToken()` routes based on `isDelegationActive`
- Classic fallback: `depositTokenClassic()` - two separate txs (approve + deposit)

### 3.5 Korisnicki interfejs
- Screen flow: setup/unlock -> wallet dashboard -> multisig deploy -> interact (propose/sign/execute/deposit)
- Smart Account toggle with loading/error states
- Cite: `\cite{ethersjs2024}`
