# Solidity

## Purpose
Domain skill for Solidity smart contract development, testing, and auditing.

## Available Workflows

### Setup
**Location:** `Workflows/setup.md`
**Trigger:** "run solidity setup" or "setup solidity project"
**Description:** Quick setup procedure for Solidity/Foundry/Hardhat repositories to enable efficient code navigation and verify build/test setup.

**Steps:**
1. Document Build & Test Commands
2. Install Dependencies & Build
3. Configure Code Navigation (VS Code)

**When to use:** At the start of working with any Solidity project to ensure proper environment setup and IDE navigation.

---

## Usage

To invoke a workflow, use:
- `/Solidity` - Shows this help
- "run solidity setup" - Runs the setup workflow
- "proceed to step N" - Continues setup from a specific step

---

## Notes
- All workflows wait for user confirmation at each major step
- Build and test commands are documented in `.claude/BUILD_COMMANDS.md`
- Setup creates `.claude/notes.md` with build results
- Command history is logged in `.claude/command-history/`
