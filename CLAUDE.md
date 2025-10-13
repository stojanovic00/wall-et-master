# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WALL-ET is a secure Ethereum wallet browser extension for Chromium-based browsers (Chrome, Brave, Edge), designed for the **Sepolia testnet**. It features standard wallet functionality plus advanced features including EIP-7702 account abstraction, multisignature contracts, and social recovery mechanisms.

**⚠️ Important: This is a testnet-only wallet for educational/demo purposes. Never use for mainnet or real funds.**

## Development Commands

### Build and Development
```bash
# Navigate to extension directory
cd extension

# Install dependencies
npm install

# Development mode with hot reload (watches for changes)
npm run dev

# Production build (outputs to dist/)
npm run build

# Start dev server (optional)
npm start
```

### Testing the Extension
1. Build the extension: `cd extension && npm run build`
2. Open Chrome/Brave/Edge and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked" and select the `extension` folder
5. After code changes, run `npm run build` and click the refresh icon on the extension card

### Network Configuration
- **Network**: Sepolia Testnet only
- **Chain ID**: 11155111
- **RPC URL**: Infura Sepolia endpoint (configured in `extension/src/config/config.json`)
- **Approver Contract**: Pre-deployed contract for EIP-7702 delegation (address in config.json)

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript
- **Ethereum Library**: ethers.js v6
- **Encryption**: crypto-js (AES encryption for private keys)
- **Build Tool**: Webpack 5 + Babel
- **Extension API**: Chrome Extension Manifest V3

### Directory Structure

```
extension/
├── src/
│   ├── components/
│   │   ├── providers/          # React Context providers for state management
│   │   │   ├── WalletProvider.tsx           # Core wallet state & operations
│   │   │   ├── MultisigContractProvider.tsx # Multisig contract interactions
│   │   │   ├── RecoveryContractProvider.tsx # Social recovery logic
│   │   │   ├── TokenProvider.tsx            # ERC20 token management
│   │   │   └── TransactionConfirmationProvider.tsx
│   │   ├── screens/            # Full-page UI components
│   │   │   ├── WalletScreen.tsx             # Main wallet dashboard
│   │   │   ├── SendScreen.tsx               # Send ETH
│   │   │   ├── SendErc20Screen.tsx          # Send ERC20 tokens
│   │   │   ├── MultisigScreen.tsx           # Deploy/manage multisig
│   │   │   ├── MultisigInteractScreen.tsx   # Interact with multisig contracts
│   │   │   ├── RecoveryContractScreen.tsx   # Social recovery setup
│   │   │   ├── ImportScreen.tsx             # Import existing wallet
│   │   │   ├── PasswordSetupScreen.tsx      # Initial password setup
│   │   │   └── ...                          # Other screens
│   │   └── navbar/             # Navigation components
│   ├── utils/                  # Utility functions
│   │   ├── multisig.ts                      # EIP-7702 delegation helpers
│   │   ├── addressBookStorage.ts            # Address book persistence
│   │   ├── multisigStorage.ts               # Multisig contract storage
│   │   └── tokenAddressBookStorage.ts       # Token address storage
│   ├── config/                 # Configuration files
│   │   └── config.json                      # Network & contract addresses
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts                         # Screen types and interfaces
│   ├── styles/                 # CSS stylesheets
│   ├── background.ts           # Extension background service worker
│   ├── popup.tsx               # Extension popup entry point
│   └── popup.html              # Extension popup HTML
├── contracts/                  # Smart contract ABIs (JSON)
│   ├── MultiSig.json           # Multisignature wallet ABI + bytecode
│   ├── SocialRecovery.json     # Social recovery contract ABI
│   ├── Approver.json           # EIP-7702 approver contract ABI
│   ├── ERC20.json              # Standard ERC20 token ABI
│   └── ...
├── webpack.config.js           # Production webpack config
├── webpack.dev.js              # Development webpack config
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
└── manifest.json               # Chrome extension manifest
```

### Core Architecture Patterns

#### 1. Provider Pattern for State Management
The app uses React Context providers to manage global state. All providers are located in `src/components/providers/`:

- **WalletProvider**: Manages core wallet functionality (generation, import, encryption, transactions)
- **MultisigContractProvider**: Handles multisig contract interactions (propose, sign, execute)
- **RecoveryContractProvider**: Manages social recovery contract operations
- **TokenProvider**: Tracks and manages ERC20 tokens
- **TransactionConfirmationProvider**: Handles transaction confirmation UI flow

**Key principle**: Each provider encapsulates related business logic and exposes it through custom hooks (e.g., `useWallet()`, `useMultisigContract()`).

#### 2. Screen-Based Navigation
The app uses a simple screen-based navigation system controlled by the `Screen` type (defined in `src/types/index.ts`). The main `App.tsx` component manages screen transitions using state:

```typescript
type Screen = "setup" | "wallet" | "send" | "multisig" | "recovery-contract" | ...
```

Screen components receive callback props to trigger navigation (e.g., `onBack`, `onSendEth`, `onTransactionSuccess`).

#### 3. Chrome Extension Architecture
- **Popup**: Main UI runs in `popup.tsx` (built to `dist/popup.html` and `dist/popup.js`)
- **Background Worker**: Service worker in `background.ts` handles extension lifecycle events and message passing
- **Storage**: Uses `chrome.storage.local` API for persistent data (with localStorage fallback for dev)

#### 4. Wallet Security Model
- Private keys are **AES-encrypted** using a user-provided password
- Password is never stored; only a SHA-256 hash is kept for verification
- When unlocked, the decrypted private key is temporarily stored in chrome.storage.local
- Wallet can be locked/unlocked without re-importing
- **⚠️ Warning**: Keys are stored locally in browser storage - device security is critical

### Smart Contract Integrations

#### Multisig Wallet (`MultiSig.json`)
Enables multi-signature wallet functionality where multiple parties must approve transactions:
- **Deploy**: `WalletProvider.deployMultiSig(signers, minSignatures)`
- **Operations**: Propose → Sign → Execute flow managed by `MultisigContractProvider`
- **Transaction Types**: Native ETH or ERC20 token transfers

#### Social Recovery (`SocialRecovery.json`)
Allows wallet recovery through trusted contacts:
- Configure recovery addresses and quorum threshold
- Recovery addresses can collectively initiate recovery to a new address
- Managed by `RecoveryContractProvider`

#### EIP-7702 Account Abstraction
Implements delegation pattern for enhanced security:
- **Approver Contract**: Pre-deployed contract that handles token approvals and deposits
- **Delegation Flow**: Wallet delegates to approver → Execute operation → Revoke delegation
- **Implementation**: See `src/utils/multisig.ts` for `createDelegation()` and `revokeDelegation()`
- **Use Case**: Securely deposit ERC20 tokens into multisig contracts in a single transaction

### Key Files to Understand

1. **`src/components/providers/WalletProvider.tsx`**: Core wallet operations (generate, import, send, balance, encryption)
2. **`src/components/App.tsx`**: Main app component with screen routing logic
3. **`src/utils/multisig.ts`**: EIP-7702 delegation utilities for advanced transactions
4. **`src/components/providers/MultisigContractProvider.tsx`**: Multisig contract interaction layer
5. **`src/background.ts`**: Extension background worker (handles storage, messages, lifecycle)

## Development Guidelines

### Adding New Screens
1. Create new screen component in `src/components/screens/`
2. Add screen type to `Screen` union in `src/types/index.ts`
3. Add case in `App.tsx` switch statement with appropriate navigation handlers
4. Pass navigation callbacks as props (e.g., `onBack`, `onSuccess`)

### Working with Smart Contracts
1. Contract ABIs are stored as JSON in `contracts/` directory
2. Import ABI: `import ContractJson from "../../../contracts/ContractName.json"`
3. Create contract instance: `new ethers.Contract(address, ContractJson.abi, signer)`
4. For new contracts, add ABI JSON and optionally bytecode if deploying

### Modifying Providers
- Providers use React Context + hooks pattern
- Add new methods to the context interface
- Implement methods in the provider component
- Expose via the custom hook (e.g., `useWallet()`)
- Use `useMemo` to prevent unnecessary re-renders

### Encryption and Storage
- **Encrypt**: `crypto.AES.encrypt(privateKey, password).toString()`
- **Decrypt**: `crypto.AES.decrypt(encryptedData, password).toString(crypto.enc.Utf8)`
- **Storage API**: Use chrome.storage.local (async) with localStorage fallback
- Always validate decrypted private keys: `/^0x?[0-9a-fA-F]{64}$/`

### Transaction Patterns
Standard transaction flow in this codebase:
1. Validate inputs (address format, amount)
2. Prepare transaction object with gas settings
3. Send transaction via wallet or contract
4. Wait for receipt: `await tx.wait()`
5. Navigate to success screen with transaction details

## Configuration

### Network Settings
Edit `extension/src/config/config.json`:
```json
{
  "APPROVER_CONTRACT": "0x...",  // EIP-7702 approver contract address
  "RPC_URL": "https://sepolia.infura.io/v3/..."  // Infura RPC endpoint
}
```

### Webpack Configuration
- **Production**: `webpack.config.js` (minimized, optimized)
- **Development**: `webpack.dev.js` (watch mode, faster builds)
- Outputs to `dist/` directory

### Build Output
After building, the `dist/` folder contains:
- `popup.html` - Extension popup page
- `popup.js` - Bundled React app
- `background.js` - Service worker
- Extension manifest and assets are in parent `extension/` directory

## Common Patterns

### Getting Wallet Instance
```typescript
import { useWallet } from './providers/WalletProvider';

const { wallet, address, getBalance, sendTransaction } = useWallet();
```

### Interacting with Multisig
```typescript
import { useMultisigContract } from './providers/MultisigContractProvider';

const { proposeNative, sign, execute, getTransactionData } = useMultisigContract();

// Wrap component with provider
<MultisigContractProvider contractAddress={address}>
  <YourComponent />
</MultisigContractProvider>
```

### Storage Access
```typescript
// Write
await chrome.storage.local.set({ key: value });

// Read
const result = await chrome.storage.local.get(['key']);
const value = result.key;
```

## Debugging

### Extension Console Logs
- Open extension popup
- Right-click → Inspect
- Check Console tab for logs from popup.tsx and components

### Background Worker Logs
- Go to `chrome://extensions/`
- Find WALL-ET extension
- Click "Inspect views: service worker"
- Check Console tab for background.ts logs

### Common Issues
- **"No wallet loaded"**: Ensure wallet is unlocked or generated
- **"Invalid private key format"**: Check private key is 64 hex chars (with/without 0x)
- **Contract call failures**: Verify contract address and network (Sepolia only)
- **Transaction failures**: Check sufficient ETH balance for gas fees

## Testing

Currently no automated tests are configured (`npm test` returns placeholder).

**Manual Testing Checklist**:
1. Generate new wallet
2. Import existing wallet
3. Send ETH transaction
4. Deploy multisig contract
5. Interact with multisig (propose/sign/execute)
6. Lock and unlock wallet
7. ERC20 token transfers

## Future Enhancements

As noted in the README, potential improvements include:
- Transaction history with Etherscan API integration
- Address book functionality (basic storage exists in utils)
- Multi-network support (currently Sepolia only)
- Enhanced UI/UX
- Password recovery/reset mechanism
- Automated testing suite
