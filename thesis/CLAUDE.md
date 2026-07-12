# CLAUDE.md - Thesis

This file provides guidance to Claude Code when working on this master's thesis.

---

## Project state

- **Chapter 1 - Uvod** (`0uvod.tex`): COMPLETE, APPROVED
- **Chapter 2 - Osnove i srodna resenja** (`1osnovniKoncepti.tex`): COMPLETE, includes a "Kripto novcanik" section (custodial/non-custodial, hot/cold) inserted after 2.1
- **Chapter 3 - Implementacija** (`2implementacija.tex`): 3.1-3.4 written (see structure below), awaiting user approval
- **Chapter 4 - Demonstracija** (`3demonstracija.tex`): NEXT TO WRITE - kompletan scenario, screenshots, stvarni podaci transakcija sa Sepolia mreze
- **Chapter 5 - Zakljucak** (`zakljucak.tex`): After chapter 4

Workflow: write one chapter/section → user approves → proceed to next.

**Scope note (important):** the thesis and hands-on testing focus is strictly the MultiSig contract and EIP-7702 delegation. Social Recovery is explicitly out of scope - don't propose testing, fixing, or writing about it. Native-ETH-only multisig flows are low priority (no EIP-7702 relevance). Frontend implementation detail is intentionally de-emphasized in chapter 3 - only the parts touching contract calls and type-4 transaction construction matter; see 3.1's trimmed scope below.

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
9. **First use of a technical term/loanword** (ONLY the very first occurrence in the whole thesis, across all chapters - do NOT repeat the gloss if the term is reintroduced/re-explained in a later chapter): introduce with a Serbian phrase followed by `(engl. \en{Term})` - the literal word `engl.` (short for `engleski`) is typed in plain Latin (NOT wrapped in `\en{}`, so it maps to Cyrillic `енгл.` like normal text), and only the actual foreign term inside the parens gets `\en{}`. Example: `Vi\v sepotpisni (engl. \en{multisig}) protokoli`, `delegacijski ozna\v civa\v c (engl. \en{delegation designator})`. Flagged explicitly by the professor's review. Before adding this gloss, grep the WHOLE thesis for the term - if it already appears earlier in an earlier chapter, do not add the gloss again, just use `\en{Term}` bare.
10. **"pametni" (smart account context)**: put in Serbian quotes - `"pametni"`.
11. **\cite{key1,key2}**: NO space between keys. A space causes wrong Cyrillic output (`[накамото2008, 2]` instead of `[1, 2]`).
12. References must be specific and non-vague. Never cite just a docs homepage if a whitepaper or EIP page exists.
13. **"pro\v sirenje pregleda\v ca" -> use "veb ekstenzija"** for "browser extension" (feminine noun, watch agreement: `ekstenzija je namenjena`, `implementirana kao`). No need for an extra `(\en{web extension})` gloss since "ekstenzija" already carries the loanword.
14. **\texttt{lstlisting} captions go below the code**, not above (`captionpos=b`, set globally in `main.tex`'s `\lstset`).
15. **CRITICAL - never write the thesis as a development log.** No "prva implementacija nije uključivala...", "greška je otkrivena...", "nakon ispravke...", "dodati su naknadno da bi se otklonio nedostatak". Describe the finished system's functionality directly, as if it always worked this way - even when the real story (in this session's work) was "we found a bug and fixed it." Keep any genuinely general fact learned along the way (e.g. a protocol subtlety), strip the "here's the bug we hit" framing entirely. Real transaction dumps/empirical data are still fine to include, introduced as "here is an example," never as "after the fix, this is what it showed."

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

## Chapter 3 structure (Implementacija) - as actually written

File: `2implementacija.tex`. Backend/contracts-focused per user's explicit direction - frontend (providers, screens, storage) intentionally kept minimal.

### 3.1 Arhitektura sistema (trimmed, ~2 paragraphs)
- Tech stack one-liner: React 18 + TypeScript + ethers.js v6, Solidity + Foundry for contracts
- No backend server/DB - extension talks to Ethereum only via RPC node
- Shared business logic (multisig authorization, EIP-7702 delegation) lives entirely in the contracts (3.2/3.3), client only builds/signs/sends txs and reads state
- Deliberately does NOT cover: MV3 popup/service-worker split, provider pattern, Screen navigation, storage details - cut per user request to not dwell on frontend

### 3.2 Ugovor MultiSig
- State/constructor: `signers` mapping is private with no enumeration - `nonce`, `transactions`, `transactionSigners` mappings (code listing)
- `proposeToken`: `txHash = keccak256(msg.sender, nonce++)` - depends only on proposer+nonce, not tx content (code listing)
- `sign`/`execute`: originally emitted no events at all (only `propose` did) - added `Signed(txHash, signer)` and `Executed(txHash)` events after identifying the gap during testing, narrated as a real before/after fix in the thesis text (parallel to the nonce+1 fix in 3.3). `execute` checks `signedCount >= minSignatures` and balance sufficiency before transferring (code listing). Client now reads `Signed` via `contract.queryFilter(contract.filters.Signed(txHash))` instead of probing `hasSignedTx` per known signer - mentioned briefly. Caveat: only new deployments emit these, already-deployed contracts are immutable.
- `depositToken`: token address read from the stored proposal, not caller-supplied, requires prior `approve()` (code listing)

### 3.3 Ugovor Approver i EIP-7702 delegacija
- `Approver.sol`: `approveToken`/`depositTokenToMultiSig`/`approveAndDeposit`, calls itself via `this.` so `address(this)` resolves to the delegated EOA (code listings)
- Client-side type-4 tx construction: `setupDelegation`/`revokeDelegation` from `utils/multisig.ts`, `signer.authorize()` (code listings)
- Chain ID auto-inherited from the connected provider (`populateAuthorization` in ethers source)
- **Self-sponsored nonce+1 subtlety** (heavily emphasized - this was a real bug found and fixed this session): authority's nonce is already bumped by the tx's own nonce consumption by the time the authorization check runs, so a self-sponsored authorization needs `currentNonce + 1`, not `currentNonce`. Real captured Sepolia tx data included as a listing (type=4, tx nonce=2, authorization nonce=3, chainId=0xaa36a7) plus the resulting `eth_getCode` output (`0xef0100` + Approver address) as empirical proof
- `revokeDelegation` - same self-send pattern, was already correct

### 3.4 Klijentski pozivi ugovora (brief)
- `ethers.Contract` wrapping pattern
- Two deposit paths as code listings: `depositTokenWithDelegation` (bundled, one tx, calls `approveAndDeposit` on own address) vs `approveTokenClassic`+`depositTokenClassic` (two separate txs)

### Not yet written
- Zakljucak (chapter 4)
- Anything about Social Recovery, native-ETH-only multisig flows, or detailed frontend/UI - out of scope, see scope note above
