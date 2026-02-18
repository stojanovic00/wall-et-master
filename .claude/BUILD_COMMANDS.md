# Build & Test Commands

## Solidity Contracts (Foundry)

### Build Commands
```bash
# Build all contracts
cd contracts && forge build

# Or using Make (from root)
make build-contracts

# Full build (contracts + extension)
make build
```

### Test Commands
```bash
# Run all tests with verbose output
cd contracts && forge test -vvv

# Or using Make (from root)
make test

# Run specific test
cd contracts && forge test --match-test testFunctionName -vvv

# Run tests for specific contract
cd contracts && forge test --match-contract ContractName -vvv
```

### Deployment Commands
```bash
# Deploy a contract (with constructor args)
make deploy-contract CONTRACT_NAME=src/contracts/MyContract.sol:MyContract PRIVATE_KEY=0x... CONSTRUCTOR_ARGS="arg1 arg2"

# Deploy without constructor args
make deploy-contract-without-params CONTRACT_NAME=src/contracts/MyContract.sol:MyContract PRIVATE_KEY=0x...
```

### Utility Commands
```bash
# Check ERC20 balance
make erc20-balance CONTRACT_ADDRESS=0x... ADDRESS=0x...

# Mint tokens
make mint CONTRACT_ADDRESS=0x... ADDRESS=0x... AMOUNT=1000000000000000000
```

## Extension (React/TypeScript)

### Build Commands
```bash
# Development mode with hot reload
cd extension && npm run dev

# Production build
cd extension && npm run build

# Or using Make (from root)
make build-extension
make dev
```

### Test Commands
```bash
cd extension && npm test
```

## Project Structure

```
contracts/
├── src/
│   ├── contracts/     # Main contracts (MultiSig, SocialRecovery, Approver, RSDC)
│   └── interfaces/    # Contract interfaces
├── test/              # Foundry tests
├── lib/               # Dependencies (forge-std, etc.)
├── out/               # Build artifacts
└── foundry.toml       # Foundry configuration

extension/
├── src/               # React/TypeScript source
├── contracts/         # Compiled ABIs (copied from contracts/out/)
└── dist/              # Build output
```

## Quick Start

```bash
# 1. Install dependencies
cd contracts && forge install

# 2. Build contracts
forge build

# 3. Run tests
forge test -vvv

# 4. Build extension
cd ../extension && npm install && npm run build
```
