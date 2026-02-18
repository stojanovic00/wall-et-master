# Solidity-Setup

## Purpose
Quick setup procedure for Solidity/Foundry/Hardhat repositories to enable efficient code navigation and verify build/test setup. **Important:** Dependencies must be installed BEFORE navigation will work in monorepos.

## Command History
All bash commands executed during this skill run should be logged to `.claude/command-history/solidity-setup-<timestamp>.md` for future reference.

---

## Step 1: Document Build & Test Commands

**Why first?** Understanding the project structure and dependencies before installing anything.

**1.1 Read Documentation:**
- Check `README.md`, `CONTRIBUTING.md` in root and package directories
- Look for `.github/workflows/*.yml` for CI build commands
- Check `package.json` scripts section

**1.2 Identify Solidity Tools:**
- Foundry: `forge build`, `forge test`
- Hardhat: `npx hardhat compile`, `npx hardhat test`
- Check for monorepo build scripts (e.g., `yarn workspace @pkg/name test`)

**1.3 Find Prerequisites:**
- Node.js version (check `.nvmrc` or `package.json.engines`)
- Package manager (yarn.lock → yarn, package-lock.json → npm)
- Foundry installation (if using forge)
- Submodules (check `.gitmodules`)

**Deliverable:** Create `.claude/BUILD_COMMANDS.md` with:
```markdown
# Build & Test Commands

## Prerequisites
- Node.js: [version from .nvmrc]
- Package manager: [yarn/npm/pnpm]
- Foundry: [if applicable, version if specified]
- Git submodules: [yes/no]

## Setup
\`\`\`bash
# Install dependencies
yarn install  # or npm install

# Initialize submodules (if applicable)
git submodule update --init --recursive

# Install Foundry (if needed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
\`\`\`

## Build
\`\`\`bash
# [Command found in docs/package.json]
forge build
# OR
yarn build
\`\`\`

## Test
\`\`\`bash
# Run all tests
forge test
# OR
yarn test

# Run specific test file
forge test --match-path test/specific-test.sol

# Run with verbosity
forge test -vvv
\`\`\`

## Monorepo Commands (if applicable)
\`\`\`bash
# Build specific package
yarn workspace @org/package-name build

# Test specific package
yarn workspace @org/package-name test
\`\`\`

## Common Issues
[Document any known issues from README]
```

**STOP:** Wait for user confirmation before proceeding

---

## Step 2: Install Dependencies & Build

**Why second?** For monorepos, workspace symlinks must be created before navigation will work.

**IMPORTANT:** Create `.claude/command-history/` directory and start logging all bash commands to `solidity-setup-<timestamp>.md`

**2.1 Check Node Version:**
```bash
node --version
# Compare with .nvmrc or README requirements
# Switch if needed: nvm use
```

**2.2 Initialize Git Submodules (if applicable):**
```bash
git submodule status  # Check status
git submodule update --init --recursive  # Initialize if needed
```

**2.3 Install Dependencies:**
```bash
# For Yarn workspaces
yarn install

# For npm workspaces
npm install
```

**2.4 Build Project:**
```bash
# If special build order required (e.g., balancer-js first)
yarn workspace @org/package-name build

# Then build all
yarn build  # or npm run build
```

**2.5 Verify Workspace Symlinks (for monorepos):**
```bash
ls -la node_modules/@org-name/
# Should show symlinks to pkg/* directories
```

**Deliverable:** Create `.claude/notes.md` with:
```markdown
## Build & Test Results

### Initial Setup
- Date: [date]
- Node Version: [version]
- Package Manager: [yarn/npm version]

### Commands Executed
- git submodule status/update
- yarn/npm install
- Build commands

### Build Results
- Result: ✅ Success / ❌ Failed
- Time: [duration]
- Packages built: [list]
- Warnings: [any non-critical warnings]
- Issues: [any errors]

### Workspace Symlinks
- List symlinks created in node_modules
```

**Also create:** `.claude/command-history/solidity-setup-<timestamp>.md` with:
```markdown
# Command History: solidity-setup
Date: [timestamp]

## Step 2: Install Dependencies & Build

\`\`\`bash
# All bash commands executed, in order:
node --version
git submodule status
git submodule update --init --recursive
yarn install
yarn workspace @org/package-name build
yarn build
ls -la node_modules/@org-name/
\`\`\`
```

**STOP:** Wait for user confirmation before proceeding

---

## Step 3: Configure Code Navigation

**Why last?** Navigation requires workspace symlinks to exist (created in Step 2).

**3.1 Identify Project Structure:**
- Read `foundry.toml` for:
  - Solidity version
  - Remappings
  - Source directories
- Identify package structure (e.g., `@balancer-labs/v2-*` → `pkg/*`)
- List all workspace packages

**3.2 Create `.vscode/settings.json`:**
```json
{
  "solidity.compileUsingRemoteVersion": "v0.7.1+commit.f4a555be",
  "solidity.packageDefaultDependenciesContractsDirectory": "contracts",
  "solidity.packageDefaultDependenciesDirectory": "node_modules",
  "solidity.remappingsUnix": [
    // Map @org/package-name/ to actual package locations
    "@balancer-labs/v2-interfaces/=pkg/interfaces/",
    "@balancer-labs/v2-solidity-utils/=pkg/solidity-utils/",
    // Add all workspace packages...
    // Add forge-std, ds-test paths from foundry.toml
    "forge-std/=pvt/lib/forge-std/src/",
    "ds-test/=pvt/lib/forge-std/lib/ds-test/src/"
  ],
  "solidity.monoRepoSupport": true,
  "solidity.defaultCompiler": "remote",
  "search.exclude": {
    "**/node_modules": true,
    "**/forge-artifacts": true,
    "**/forge-cache": true
  }
}
```

**Note:** Use `remappingsUnix` instead of `remappings` - it works better with workspace-relative paths.

**3.3 Test Navigation:**
1. Instruct user: Press `Ctrl+Shift+P` → "Developer: Reload Window"
2. Test import navigation: F12 on `@org/package/contracts/File.sol`
3. Test function navigation: F12 on a function call like `_upscale()`
4. Both should navigate to the actual file in `pkg/` or `node_modules/` symlink

**3.4 If Navigation Still Fails:**
- Verify remappings point to correct directories (use `ls` to check)
- Check if `node_modules/@org/package` symlinks exist
- Try switching `remappingsUnix` back to `remappings`
- Check Solidity extension output logs: `Ctrl+Shift+P` → "Output" → "Solidity"
- Verify Solidity extension is installed and enabled

**Deliverable:**
- `.vscode/settings.json` created with correct remappings
- User confirms F12 navigation works for both imports AND function definitions
- Update `.claude/notes.md` with navigation status

**STOP:** Setup complete! User can now efficiently navigate and analyze code.

---

## Usage

1. User says: **"run solidity-setup"** or **"proceed with step N"**
2. Execute that step only
3. Create deliverables
4. STOP and wait for user confirmation
5. User reviews and says: **"proceed to next step"** or requests changes
6. Continue only after explicit approval

## Notes
- This skill is specifically for Solidity projects (Foundry/Hardhat)
- **Key Insight:** For monorepos, Step 2 (install dependencies) MUST come before Step 3 (navigation setup)
- Without workspace symlinks in node_modules, navigation will not work
- Step order matters: Document → Install/Build → Configure Navigation
- If build fails in Step 2, document and wait for user to fix before proceeding
- This skill focuses on READ-ONLY setup, not making changes to the codebase
- For non-Solidity projects, create a different skill or adapt this one
