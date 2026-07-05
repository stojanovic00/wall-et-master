const MULTISIG_KEY = "multisigContracts";

export interface StoredMultisig {
  name?: string;
  signers?: string[];
  minSignatures?: number;
}

type MultisigStore = Record<string, StoredMultisig>;

function readStore(): MultisigStore {
  const data = localStorage.getItem(MULTISIG_KEY);
  if (!data) return {};
  const parsed = JSON.parse(data);
  // Migrate from the old format (a plain array of addresses, no metadata).
  if (Array.isArray(parsed)) {
    const migrated: MultisigStore = {};
    parsed.forEach((address: string) => {
      migrated[address] = {};
    });
    return migrated;
  }
  return parsed;
}

function writeStore(store: MultisigStore) {
  localStorage.setItem(MULTISIG_KEY, JSON.stringify(store));
}

export function getMultisigContracts(): string[] {
  return Object.keys(readStore());
}

export function getMultisigInfo(address: string): StoredMultisig | undefined {
  return readStore()[address];
}

export function addMultisigContract(
  address: string,
  info?: StoredMultisig
) {
  const store = readStore();
  store[address] = { ...store[address], ...info };
  writeStore(store);
}

export function removeMultisigContract(address: string) {
  const store = readStore();
  delete store[address];
  writeStore(store);
}

export function getMultisigTxs(address: string): string[] {
  const key = `multisigTxs:${address}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function addMultisigTx(address: string, txHash: string) {
  const key = `multisigTxs:${address}`;
  const txs = getMultisigTxs(address);
  if (!txs.includes(txHash)) {
    txs.push(txHash);
    localStorage.setItem(key, JSON.stringify(txs));
  }
}
