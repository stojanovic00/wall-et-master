# Deployment Guide (Internal)

Internal reference for getting contracts deployed and the extension running end to end on Sepolia. Not for end users - see `README.md` for that.

## Prerequisites

- Foundry (`forge`, `cast`) installed
- Node.js + npm installed
- Sepolia ETH in your deployer address for gas ([faucet](https://sepoliafaucet.com/))
- `contracts/.env` (gitignored, never commit it):

  ```
  SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<your-infura-key>
  SEPOLIA_PRIV_KEY=0x<throwaway-sepolia-only-private-key>
  ```

  Use a dedicated testnet-only key, generated with `cast wallet new`. Never reuse a mainnet key here.

All `make` targets below read `contracts/.env` automatically. Commands that embed the private key are prefixed with `@` in the `Makefile` so Make doesn't echo it to the terminal - but `make -n <target>` (dry run) ignores that and prints it anyway, so avoid `-n` on those targets.

## 1. Build and test contracts

```
make build-contracts
make test
```

Compiles everything in `contracts/src` and runs the Foundry test suite (Approver, MultiSig, SocialRecovery).

## 2. Deploy the Approver contract

```
make deploy-approver
```

Deploys `contracts/src/contracts/Approver.sol` via `contracts/script/DeployApprover.s.sol`. This is the fixed EIP-7702 delegation target - the only contract the extension expects to already exist at a known address. Copy the printed `Approver deployed to: 0x...` address into `extension/src/config/config.json` under `APPROVER_CONTRACT`.

`MultiSig` and `SocialRecovery` are **not** deployed here - the extension deploys a fresh instance of each per user, directly from the UI (`WalletProvider.deployMultiSig`, the recovery contract deploy flow), so there's nothing to pre-deploy for those.

**Pitfall**: the extension deploys `MultiSig`/`SocialRecovery`/`Approver` using the ABI+bytecode JSON bundled in `extension/contracts/*.json` - these are **not** automatically kept in sync with `contracts/src/`. Only `make build` (not a plain `npm run build` inside `extension/`) copies the freshly compiled `contracts/out/*.sol/*.json` into `extension/contracts/`. If you change any contract source and only rebuild the extension directly, the extension keeps deploying stale bytecode silently - contracts deployed from it will have function selectors that don't match the current source's interfaces, causing calls against them to revert with no useful error and no indication of why. Always run `make build` after touching anything under `contracts/src/`.

## 3. Deploy a test ERC20 token (optional, for testing transfers)

```
make deploy-rsdc
```

Deploys `RSDC.sol` via `contracts/script/DeployRSDC.s.sol` and mints 1,000,000 RSDC to the deployer address. Add the printed address as a token in the extension's Token screen to test ERC20 transfers and multisig deposits.

## 4. Sync contract ABIs and build the extension

```
make build
```

Runs `build-contracts`, copies the freshly compiled ABI/bytecode JSON from `contracts/out/*.sol/*.json` into `extension/contracts/*.json`, then runs `build-extension` (webpack production build to `extension/dist/`).

Use `make dev` instead during active development (webpack watch mode, rebuilds on file changes but still requires clicking the refresh icon in `chrome://extensions/` after each rebuild).

## 5. Load the extension

1. Open `chrome://extensions/` (or the Brave/Edge equivalent)
2. Enable Developer mode
3. Click Load unpacked, select the `extension/` folder
4. After any rebuild, click the refresh icon on the extension's card

## Makefile reference

| Target | Purpose |
|---|---|
| `make build-contracts` | Compile contracts with Foundry |
| `make test` | Run the Foundry test suite |
| `make deploy-approver` | Deploy `Approver.sol` via script |
| `make deploy-rsdc` | Deploy `RSDC.sol` via script, mint 1,000,000 to deployer |
| `make deploy-contract CONTRACT_NAME=... CONSTRUCTOR_ARGS=...` | Generic `forge create` with constructor args |
| `make deploy-contract-without-params CONTRACT_NAME=...` | Generic `forge create`, no constructor args |
| `make mint CONTRACT_ADDRESS=... ADDRESS=... AMOUNT=...` | Mint additional RSDC (or any `Ownable` mintable ERC20) to an address |
| `make erc20-balance CONTRACT_ADDRESS=... ADDRESS=...` | Read an ERC20 balance |
| `make propose MULTISIG_CONTRACT_ADDRESS=...` | Example multisig `propose()` call - recipient/amount are hardcoded placeholders, edit the recipe before use |
| `make get-transaction MULTISIG_CONTRACT_ADDRESS=... TX_HASH=...` | Read a multisig transaction by hash |
| `make build` | Full contracts + ABI sync + extension build |
| `make build-extension` | Extension production build only |
| `make dev` | Extension webpack watch mode |
