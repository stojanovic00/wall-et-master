import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  TransactionData,
  useMultisigContract,
} from "../providers/MultisigContractProvider";
import { getMultisigTxs, addMultisigTx, getMultisigInfo, addMultisigContract } from "../../utils/multisigStorage";
import LoadingScreen from "./LoadingScreen";
import { getTokenAddressBook } from "../../utils/tokenAddressBookStorage";
import { getAddressBook } from "../../utils/addressBookStorage";
import { useWallet } from "../providers/WalletProvider";
import { useTransactionConfirmation } from "../providers/TransactionConfirmationProvider";

interface MultisigInteractScreenProps {
  onBack: () => void;
  contractAddress: string;
  onMultisigTransactionSuccess: (transactionData: {
    transactionType: "propose" | "deposit" | "sign" | "execute";
    txHash: string;
    contractAddress: string;
    transactionId: string;
    recipientAddress?: string;
    amount?: string;
    tokenAddress?: string;
    signerAddress: string;
    chainId: number;
    timestamp: number;
  }) => void;
}

interface TransactionDataLocal {
  hash: string;
  to: string;
  amount: string;
  proposer: string;
  timestamp: string;
  signedCount: string;
  executed: boolean;
  balance: string;
  native: boolean;
  token: string;
}

const MultisigInteractScreen: React.FC<MultisigInteractScreenProps> = ({
  onBack,
  contractAddress,
  onMultisigTransactionSuccess,
}) => {
  const {
    contract,
    proposeNative,
    proposeToken,
    depositNative,
    depositToken,
    approveTokenForDeposit,
    finalizeTokenDeposit,
    sign,
    execute,
    getTransactionData,
    getMinSignatures,
    error: contractError,
  } = useMultisigContract();
  const { wallet, isDelegationActive } = useWallet();
  const { showTransactionConfirmation } = useTransactionConfirmation();
  const [activeTab, setActiveTab] = useState<
    "propose" | "deposit" | "sign" | "execute" | "transactions"
  >("propose");
  const [proposeType, setProposeType] = useState<"native" | "token">("native");
  const [txs, setTxs] = useState<TransactionDataLocal[]>([]); // Transactions with details
  const [error, setError] = useState("");

  // Propose form state
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");

  // Deposit form state
  const [depositTxId, setDepositTxId] = useState("");
  const [depositValue, setDepositValue] = useState("");
  // Derived from the looked-up transaction itself - a proposed transaction has
  // exactly one token address baked in, so the user shouldn't re-choose it here.
  const [depositTxData, setDepositTxData] = useState<TransactionDataLocal | null>(
    null
  );
  const [depositTxLookupError, setDepositTxLookupError] = useState("");

  // Sign/Execute form state (separate so switching tabs doesn't pre-populate the other)
  const [signTxId, setSignTxId] = useState("");
  const [executeTxId, setExecuteTxId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"propose" | "approve" | "deposit" | "sign" | "execute" | null>(null);
  const [minSignatures, setMinSignatures] = useState<number | null>(null);

  // Contract metadata recorded locally at deploy time - the contract itself
  // has no way to enumerate its signers, only to check one address at a time.
  const [contractName, setContractName] = useState<string | undefined>(undefined);
  const [knownSigners, setKnownSigners] = useState<string[]>([]);
  const [showSignersModal, setShowSignersModal] = useState(false);
  const [signedByList, setSignedByList] = useState<string[] | null>(null);
  const [signedByLoading, setSignedByLoading] = useState(false);

  const [txHashes, setTxHashes] = useState<string[]>([]);

  const [selectedTxHash, setSelectedTxHash] = useState<string | undefined>(
    undefined
  );
  const [selectedTx, setSelectedTx] = useState<TransactionDataLocal | null>(
    null
  );

  const [tokenAddressOptions, setTokenAddressOptions] = useState<
    {
      address: string;
      name: string;
      symbol: string;
    }[]
  >([]);

  const [recipientOptions, setRecipientOptions] = useState<
    {
      address: string;
      name: string;
    }[]
  >([]);

  const bigNumberishToString = (
    value: ethers.BigNumberish,
    inEther: boolean = false
  ) => {
    if (typeof value === "string") {
      return value;
    }

    return inEther ? ethers.formatEther(value) : value.toString();
  };

  // Discover every proposed tx hash directly from contract storage
  // (getAllTransactionHashes), merged with whatever's recorded locally. A
  // signer using a different browser profile than whoever proposed has no
  // local record at all, so the chain has to be the source of truth. This
  // reads the array directly rather than scanning Propose event logs, since
  // some public RPC providers (e.g. drpc.org's free tier) hard-cap
  // eth_getLogs block ranges and reject wider historical queries.
  const discoverTxHashes = async (): Promise<string[]> => {
    const local = getMultisigTxs(contractAddress);
    if (!contract) return local;
    try {
      const chainHashes: string[] = await contract.getAllTransactionHashes();
      const merged = Array.from(new Set([...local, ...chainHashes]));
      merged.forEach((hash) => addMultisigTx(contractAddress, hash));
      return merged;
    } catch (err) {
      console.error("Failed to fetch transaction hashes from contract:", err);
      return local;
    }
  };

  const fetchTransactions = async () => {
    const hashes = await discoverTxHashes();
    setTxHashes(hashes);
    const details = await Promise.all(
      hashes.map(async (hash) => {
        const data = await getTransactionData(hash);
        if (!data) return null;

        return {
          hash,
          to: data.to,
          amount: bigNumberishToString(data.amount, true),
          proposer: data.proposer,
          timestamp: bigNumberishToString(data.timestamp),
          signedCount: bigNumberishToString(data.signedCount),
          executed: data.executed,
          balance: bigNumberishToString(data.balance, true),
          native: data.native,
          token: data.token,
        };
      })
    );

    setTxs(details.filter(Boolean) as TransactionDataLocal[]);
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [contractAddress, contract]);

  // Signers similarly can't be enumerated by the isSigner mapping alone -
  // getSigners() reads the array kept alongside it directly, so this works
  // for any signer regardless of who deployed the contract or which browser
  // profile they're using, with no local storage or event-log dependency.
  useEffect(() => {
    const info = getMultisigInfo(contractAddress);
    setContractName(info?.name);
    setKnownSigners(info?.signers || []);

    if (!contract) return;
    let cancelled = false;
    (async () => {
      try {
        const [signers, chainName]: [string[], string] = await Promise.all([
          contract.getSigners(),
          contract.name(),
        ]);
        if (cancelled) return;
        setKnownSigners(signers);
        const resolvedName = chainName || info?.name;
        setContractName(resolvedName);
        addMultisigContract(contractAddress, { signers, name: resolvedName });
      } catch (err) {
        console.error("Failed to fetch signers/name from contract:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contractAddress, contract]);

  useEffect(() => {
    // Fetch minimum signatures required
    const fetchMinSignatures = async () => {
      try {
        const minSig = await getMinSignatures();
        setMinSignatures(minSig);
      } catch (err) {
        console.error("Failed to fetch min signatures:", err);
      }
    };
    fetchMinSignatures();
  }, [getMinSignatures]);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  useEffect(() => {
    if (txHashes.length > 0) {
      if (!selectedTxHash || !txHashes.includes(selectedTxHash)) {
        setSelectedTxHash(txHashes[0]);
      }
    } else {
      setSelectedTxHash(undefined);
    }
  }, [txHashes]);

  useEffect(() => {
    if (selectedTxHash && txs.length > 0) {
      const found = txs.find((tx) => tx.hash === selectedTxHash);
      setSelectedTx(found || null);
    } else {
      setSelectedTx(null);
    }
  }, [selectedTxHash, txs]);

  // Reads who signed directly from contract storage (getTxSigners) - no need
  // to know the signer list in advance, and no dependency on event logs or
  // their RPC-provider-specific block range limits. Only works for contracts
  // deployed after this function was added; older deployments just return
  // an empty array since txSigners was never populated for them.
  useEffect(() => {
    if (!selectedTx || !contract) {
      setSignedByList(null);
      return;
    }
    let cancelled = false;
    setSignedByLoading(true);
    (async () => {
      try {
        const signers: string[] = await contract.getTxSigners(selectedTx.hash);
        if (!cancelled) {
          setSignedByList(signers);
          setSignedByLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSignedByList(null);
          setSignedByLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedTx, contract]);

  useEffect(() => {
    // Load token address book for datalist
    const tokenBook = getTokenAddressBook();
    setTokenAddressOptions(
      Object.entries(tokenBook).map(([address, info]) => ({
        address,
        name: info.name,
        symbol: info.symbol,
      }))
    );
  }, [contractAddress]);

  useEffect(() => {
    // Load recipient address book for datalist, plus the current wallet itself
    const addressBook = getAddressBook();
    const entries = Object.entries(addressBook).map(([address, name]) => ({
      address,
      name: String(name),
    }));
    if (wallet && !entries.some((e) => e.address.toLowerCase() === wallet.address.toLowerCase())) {
      entries.unshift({ address: wallet.address, name: "You" });
    }
    setRecipientOptions(entries);
  }, [contractAddress, wallet]);

  // Look up the transaction as soon as a full txHash is entered on the deposit
  // tab, so its type/token are read from the contract instead of re-asked.
  useEffect(() => {
    const trimmed = depositTxId.trim();
    if (!ethers.isHexString(trimmed, 32)) {
      setDepositTxData(null);
      setDepositTxLookupError("");
      return;
    }

    const cached = txs.find(
      (tx) => tx.hash.toLowerCase() === trimmed.toLowerCase()
    );
    if (cached) {
      setDepositTxData(cached);
      setDepositTxLookupError("");
      return;
    }

    let cancelled = false;
    (async () => {
      const data = await getTransactionData(trimmed);
      if (cancelled) return;
      if (!data || data.proposer === ethers.ZeroAddress) {
        setDepositTxData(null);
        setDepositTxLookupError("Transaction not found");
        return;
      }
      const local: TransactionDataLocal = {
        hash: trimmed,
        to: data.to,
        amount: bigNumberishToString(data.amount, true),
        proposer: data.proposer,
        timestamp: bigNumberishToString(data.timestamp),
        signedCount: bigNumberishToString(data.signedCount),
        executed: data.executed,
        balance: bigNumberishToString(data.balance, true),
        native: data.native,
        token: data.token,
      };
      setDepositTxData(local);
      setDepositTxLookupError("");
    })();

    return () => {
      cancelled = true;
    };
  }, [depositTxId, txs, getTransactionData]);

  // Handlers for each action
  const handlePropose = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!to || !value) return setError("Recipient and value required");
    setLoading(true);
    setLoadingType("propose");
    try {
      let txHash: string | null = null;
      if (proposeType === "native") {
        txHash = await proposeNative(to, ethers.parseEther(value));
      } else {
        if (!tokenAddress) return setError("Token address required");
        const tokenBook = getTokenAddressBook();
        let decimals = 18;
        if (tokenBook[tokenAddress]) {
          decimals = tokenBook[tokenAddress].decimals;
        } else if (wallet?.provider) {
          try {
            const tokenContract = new ethers.Contract(
              tokenAddress,
              ["function decimals() view returns (uint8)"],
              wallet.provider
            );
            decimals = Number(await tokenContract.decimals());
          } catch {}
        }
        txHash = await proposeToken(to, ethers.parseUnits(value, decimals), tokenAddress);
      }
      if (!txHash) return;
      addMultisigTx(contractAddress, txHash);
      setTxHashes(getMultisigTxs(contractAddress));
      onMultisigTransactionSuccess({
        transactionType: "propose",
        txHash,
        contractAddress,
        transactionId: txHash,
        recipientAddress: to,
        amount: value,
        tokenAddress: proposeType === "token" ? tokenAddress : undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!depositTxId || !depositValue)
      return setError("Transaction ID and value required");
    if (!depositTxData) {
      return setError(
        depositTxLookupError || "Enter a valid, already-proposed transaction ID"
      );
    }

    const existingTxs = getMultisigTxs(contractAddress);
    if (!existingTxs.includes(depositTxId)) {
      addMultisigTx(contractAddress, depositTxId);
    }

    const reportSuccess = () => {
      onMultisigTransactionSuccess({
        transactionType: "deposit",
        txHash: depositTxId,
        contractAddress,
        transactionId: depositTxId,
        recipientAddress: undefined,
        amount: depositValue,
        tokenAddress: depositTxData.native ? undefined : depositTxData.token,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setTxHashes(getMultisigTxs(contractAddress));
    };

    if (depositTxData.native) {
      const confirmed = await showTransactionConfirmation({
        type: "multisig-deposit",
        to: contractAddress,
        from: wallet?.address || "",
        amount: depositValue,
        txHash: depositTxId,
        chainId: 11155111,
        title: "Confirm Deposit",
        description: "Deposits native ETH against this proposed transaction.",
      });
      if (!confirmed) return;

      setLoading(true);
      setLoadingType("deposit");
      try {
        const depositResult = await depositNative(depositTxId, ethers.parseEther(depositValue));
        if (!depositResult) return;
        reportSuccess();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingType(null);
      }
      return;
    }

    // Token deposit - address/decimals come from the proposed transaction itself
    // (depositTxData.token), not from user input - see the lookup effect above.
    const tokenInfo = getTokenAddressBook()[depositTxData.token];
    const decimals = tokenInfo?.decimals ?? 18;
    const amountParsed = ethers.parseUnits(depositValue, decimals);

    if (isDelegationActive) {
      // Smart Account active: one confirmation, one bundled approve+deposit transaction.
      const confirmed = await showTransactionConfirmation({
        type: "multisig-deposit",
        to: contractAddress,
        from: wallet?.address || "",
        amount: depositValue,
        tokenAddress: depositTxData.token,
        tokenSymbol: tokenInfo?.symbol,
        txHash: depositTxId,
        chainId: 11155111,
        title: "Approve and Deposit",
        description: "Smart Account is active - approve and deposit happen together in a single transaction.",
      });
      if (!confirmed) return;

      setLoading(true);
      setLoadingType("deposit");
      try {
        const depositResult = await depositToken(depositTxId, depositTxData.token, amountParsed);
        if (!depositResult) return;
        reportSuccess();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingType(null);
      }
      return;
    }

    // Smart Account inactive: classic path, two separate transactions, each
    // with its own confirmation before it fires.
    const confirmedApprove = await showTransactionConfirmation({
      type: "token-approval",
      to: depositTxData.token,
      from: wallet?.address || "",
      amount: depositValue,
      tokenAddress: depositTxData.token,
      tokenSymbol: tokenInfo?.symbol,
      chainId: 11155111,
      title: "Step 1/2: Approve Token",
      description: "Smart Account is inactive - this approves the multisig contract to spend this amount. A second transaction will then deposit it.",
    });
    if (!confirmedApprove) return;

    setLoading(true);
    setLoadingType("approve");
    let approveOk = false;
    try {
      approveOk = await approveTokenForDeposit(depositTxData.token, amountParsed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
    if (!approveOk) return;

    const confirmedDeposit = await showTransactionConfirmation({
      type: "multisig-deposit",
      to: contractAddress,
      from: wallet?.address || "",
      amount: depositValue,
      tokenAddress: depositTxData.token,
      tokenSymbol: tokenInfo?.symbol,
      txHash: depositTxId,
      chainId: 11155111,
      title: "Step 2/2: Deposit Token",
      description: "Deposits the now-approved amount into the proposed transaction.",
    });
    if (!confirmedDeposit) return;

    setLoading(true);
    setLoadingType("deposit");
    try {
      const depositOk = await finalizeTokenDeposit(depositTxId, amountParsed);
      if (!depositOk) return;
      reportSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signTxId) return setError("Transaction ID required");
    setLoading(true);
    setLoadingType("sign");
    try {
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(signTxId)) {
        const txData = await getTransactionData(signTxId);
        if (txData) {
          addMultisigTx(contractAddress, signTxId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }

      const signResult = await sign(signTxId);
      if (!signResult) return;

      onMultisigTransactionSuccess({
        transactionType: "sign",
        txHash: signTxId,
        contractAddress,
        transactionId: signTxId,
        recipientAddress: undefined,
        amount: undefined,
        tokenAddress: undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setTxHashes(getMultisigTxs(contractAddress));
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!executeTxId) return setError("Transaction ID required");
    setLoading(true);
    setLoadingType("execute");
    try {
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(executeTxId)) {
        const txData = await getTransactionData(executeTxId);
        if (txData) {
          addMultisigTx(contractAddress, executeTxId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }

      const executeResult = await execute(executeTxId);
      if (!executeResult) return;

      onMultisigTransactionSuccess({
        transactionType: "execute",
        txHash: executeTxId,
        contractAddress,
        transactionId: executeTxId,
        recipientAddress: undefined,
        amount: undefined,
        tokenAddress: undefined,
        signerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setTxHashes(getMultisigTxs(contractAddress));
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <div className="container position-relative">
      {loading && (
        <div className="fixed-fullscreen-overlay">
          <div className="loading-content" style={{
            background: '#1a1f2e',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            minWidth: '280px',
            maxWidth: '320px'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid #334155',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '16px' }}>
              {loadingType === "propose" && "📝 Proposing Transaction..."}
              {loadingType === "approve" && "🔐 Approving Token..."}
              {loadingType === "deposit" && "💰 Processing Deposit..."}
              {loadingType === "sign" && "✍️ Signing Transaction..."}
              {loadingType === "execute" && "✅ Executing Transaction..."}
              {!loadingType && "⏳ Processing Transaction..."}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your transaction is being processed on the blockchain.
            </p>
            <div style={{ 
              background: '#0f1419', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid #334155',
              fontSize: '11px',
              color: '#64748b'
            }}>
              This may take a few moments depending on network conditions.
            </div>
          </div>
        </div>
      )}
      {showSignersModal && (
        <div
          className="fixed-fullscreen-overlay"
          onClick={() => setShowSignersModal(false)}
        >
          <div
            className="loading-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1f2e',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #3b82f6',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              textAlign: 'left',
              minWidth: '320px',
              maxWidth: '420px',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px' }}>
              Authorized Signers{contractName ? ` - ${contractName}` : ""}
            </h3>
            {knownSigners.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                Signer list not available - this multisig wasn't deployed from
                this wallet, so its signer list was never recorded locally.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {knownSigners.map((addr) => {
                  const isYou = wallet?.address.toLowerCase() === addr.toLowerCase();
                  const bookEntry = recipientOptions.find(
                    (r) => r.address.toLowerCase() === addr.toLowerCase()
                  );
                  const label = isYou ? "You" : bookEntry?.name;
                  return (
                    <div
                      key={addr}
                      style={{
                        background: '#0f1419',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                      }}
                    >
                      {label && (
                        <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>
                          {label}
                        </div>
                      )}
                      <div style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        {addr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="button-group margin-top-12">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setShowSignersModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="screen">
        <div className="multisig-content">
          <h2>{contractName || "Interact with MultiSig Contract"}</h2>
          <div className="form-group">
            <label>
              Contract Address:{" "}
              {contractAddress || (
                <span style={{ color: "red" }}>No contract address</span>
              )}
            </label>
          </div>
          <div className="form-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowSignersModal(true)}
            >
              View Signers {knownSigners.length > 0 ? `(${knownSigners.length})` : ""}
            </button>
          </div>
          <div className="multisig-tab-buttons">
            <button
              className={`btn${activeTab === "propose" ? " btn-primary" : " btn-secondary"}`}
              onClick={() => setActiveTab("propose")}
            >
              Propose
            </button>
            <button
              className={`btn${activeTab === "deposit" ? " btn-primary" : " btn-secondary"}`}
              onClick={() => setActiveTab("deposit")}
            >
              Deposit
            </button>
            <button
              className={`btn${activeTab === "sign" ? " btn-primary" : " btn-secondary"}`}
              onClick={() => setActiveTab("sign")}
            >
              Sign
            </button>
            <button
              className={`btn${activeTab === "execute" ? " btn-primary" : " btn-secondary"}`}
              onClick={() => setActiveTab("execute")}
            >
              Execute
            </button>
            <button
              className={`btn${
                activeTab === "transactions" ? " btn-primary" : " btn-secondary"
              }`}
              onClick={() => setActiveTab("transactions")}
            >
              Transactions
            </button>
            <button className="btn btn-secondary" onClick={onBack}>
              Back
            </button>
          </div>
          {(contractError || error) && (
            <div className="warning">{contractError || error}</div>
          )}
          {activeTab === "propose" && (
            <form onSubmit={handlePropose} className="margin-top-16">
              <div className="toggle-btn-group">
                <button
                  type="button"
                  className={`toggle-btn ${proposeType === "native" ? "active" : ""}`}
                  onClick={() => setProposeType("native")}
                >
                  Native
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${proposeType === "token" ? "active" : ""}`}
                  onClick={() => setProposeType("token")}
                >
                  Token
                </button>
              </div>
              <div className="form-group">
                <label>To (recipient):</label>
                <input
                  type="text"
                  className="input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="0x..."
                  list="recipient-address-list"
                />
                <datalist id="recipient-address-list">
                  {recipientOptions.map((opt) => (
                    <option value={opt.address} key={opt.address}>
                      {opt.name} {opt.address ? `(${opt.address})` : ""}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>
                  Value ({proposeType === "native" ? "ETH" : "Token Amount"}):
                </label>
                <input
                  type="number"
                  className="input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              {proposeType === "token" && (
                <div className="form-group">
                  <label>Token Address:</label>
                  <input
                    type="text"
                    className="input"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0x..."
                    list="token-address-list"
                  />
                  <datalist id="token-address-list">
                    {tokenAddressOptions.map((opt) => (
                      <option value={opt.address} key={opt.address}>
                        {opt.address} {opt.symbol ? `(${opt.symbol})` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  Propose
                </button>
              </div>
            </form>
          )}
          {activeTab === "deposit" && (
            <form onSubmit={handleDeposit} className="margin-top-16">
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={depositTxId}
                  onChange={(e) => setDepositTxId(e.target.value)}
                  placeholder="Transaction ID"
                  list="deposit-txid-list"
                />
                <datalist id="deposit-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
              </div>
              {depositTxLookupError && (
                <div className="warning margin-top-4">{depositTxLookupError}</div>
              )}
              {depositTxData && (
                <div className="form-group">
                  <label>This transaction deposits:</label>
                  <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                    {depositTxData.native
                      ? "Native ETH"
                      : (() => {
                          const info = getTokenAddressBook()[depositTxData.token];
                          return info
                            ? `${info.symbol} (${depositTxData.token.slice(0, 6)}...${depositTxData.token.slice(-4)})`
                            : depositTxData.token;
                        })()}
                  </div>
                </div>
              )}
              <div className="form-group">
                <label>
                  Value ({depositTxData ? (depositTxData.native ? "ETH" : "Token Amount") : "ETH or Token Amount"}):
                </label>
                <input
                  type="number"
                  className="input"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={!depositTxData}>
                  Deposit
                </button>
              </div>
            </form>
          )}
          {activeTab === "sign" && (
            <form onSubmit={handleSign} className="margin-top-16">
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={signTxId}
                  onChange={(e) => setSignTxId(e.target.value)}
                  placeholder="Transaction ID"
                  list="sign-txid-list"
                />
                <datalist id="sign-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  Sign
                </button>
              </div>
            </form>
          )}
          {activeTab === "execute" && (
            <form onSubmit={handleExecute} className="margin-top-16">
              <div className="form-group">
                <label>Transaction ID:</label>
                <input
                  type="text"
                  className="input"
                  value={executeTxId}
                  onChange={(e) => setExecuteTxId(e.target.value)}
                  placeholder="Transaction ID"
                  list="execute-txid-list"
                />
                <datalist id="execute-txid-list">
                  {txHashes.map((hash) => (
                    <option value={hash} key={hash} />
                  ))}
                </datalist>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  Execute
                </button>
              </div>
            </form>
          )}
          {activeTab === "transactions" && (
            <div className="margin-top-16">
              <h3>Transaction History</h3>
              {txs.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                  fontSize: '14px',
                  background: '#0f1419',
                  borderRadius: '12px',
                  border: '1px solid #334155'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>📋</div>
                  No transactions found for this contract
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="tx-hash-dropdown">
                      Select Transaction:
                    </label>
                    <select
                      id="tx-hash-dropdown"
                      className="input"
                      style={{ width: "100%", marginBottom: 16 }}
                      value={
                        txHashes.length > 0
                          ? typeof selectedTxHash !== "undefined"
                            ? selectedTxHash
                            : txHashes[0]
                          : ""
                      }
                      onChange={(e) => setSelectedTxHash(e.target.value)}
                    >
                      {txHashes.map((hash, index) => (
                        <option value={hash} key={hash}>
                          Transaction #{index + 1} - {hash.substring(0, 8)}...{hash.substring(hash.length - 6)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedTx && (
                    <div style={{
                      background: '#0f1419',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      overflow: 'hidden'
                    }}>
                      {/* Transaction Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        padding: '16px 20px',
                        borderBottom: '1px solid #334155'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <h4 style={{
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0'
                          }}>
                            Transaction Details
                          </h4>
                          <div style={{
                            background: selectedTx.executed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: selectedTx.executed ? '#10b981' : '#f59e0b',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: `1px solid ${selectedTx.executed ? '#10b981' : '#f59e0b'}`
                          }}>
                            {selectedTx.executed ? '✅ Executed' : '⏳ Pending'}
                          </div>
                        </div>
                        <div style={{
                          color: '#e2e8f0',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}>
                          {selectedTx.hash}
                        </div>
                      </div>

                      {/* Transaction Content */}
                      <div style={{ padding: '20px' }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px',
                          marginBottom: '20px'
                        }}>
                          {/* Left Column */}
                          <div>
                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Recipient
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}>
                                {selectedTx.to}
                              </div>
                            </div>

                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Amount
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}>
                                {selectedTx.amount} {selectedTx.native ? 'ETH' : 'Tokens'}
                              </div>
                            </div>

                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Type
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: '500'
                              }}>
                                {selectedTx.native
                                  ? '🪙 Native ETH'
                                  : `🪙 ${getTokenAddressBook()[selectedTx.token]?.symbol || "ERC-20 Token"}`}
                              </div>
                              {!selectedTx.native && (
                                <div style={{
                                  color: '#64748b',
                                  fontSize: '11px',
                                  fontFamily: 'monospace',
                                  marginTop: '4px',
                                  wordBreak: 'break-all'
                                }}>
                                  {selectedTx.token}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Column */}
                          <div>
                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Proposer
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                              }}>
                                {selectedTx.proposer}
                              </div>
                            </div>

                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155',
                              marginBottom: '12px'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Signatures
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}>
                                {selectedTx.signedCount} / {minSignatures}
                              </div>
                            </div>

                            <div style={{
                              background: '#1a1f2e',
                              padding: '12px',
                              borderRadius: '8px',
                              border: '1px solid #334155'
                            }}>
                              <div style={{
                                color: '#94a3b8',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '4px'
                              }}>
                                Contract Balance
                              </div>
                              <div style={{
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: '600'
                              }}>
                                {selectedTx.balance} {selectedTx.native ? 'ETH' : 'Tokens'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Info */}
                        <div style={{
                          background: '#1a1f2e',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            color: '#94a3b8',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '4px'
                          }}>
                            Timestamp
                          </div>
                          <div style={{
                            color: '#ffffff',
                            fontSize: '13px',
                            fontFamily: 'monospace'
                          }}>
                            {new Date(parseInt(selectedTx.timestamp) * 1000).toLocaleString()}
                          </div>
                        </div>

                        {/* Signed By */}
                        <div style={{
                          background: '#1a1f2e',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #334155',
                          marginTop: '12px'
                        }}>
                          <div style={{
                            color: '#94a3b8',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '8px'
                          }}>
                            Signed By
                          </div>
                          {signedByLoading ? (
                            <div style={{ color: '#64748b', fontSize: '12px' }}>
                              Checking signatures...
                            </div>
                          ) : signedByList && signedByList.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {signedByList.map((addr) => {
                                const isYou = wallet?.address.toLowerCase() === addr.toLowerCase();
                                const bookEntry = recipientOptions.find(
                                  (r) => r.address.toLowerCase() === addr.toLowerCase()
                                );
                                const label = isYou ? "You" : bookEntry?.name;
                                return (
                                  <div
                                    key={addr}
                                    style={{
                                      color: '#10b981',
                                      fontSize: '12px',
                                      fontFamily: 'monospace',
                                      wordBreak: 'break-all'
                                    }}
                                  >
                                    ✅ {label ? `${label} (${addr})` : addr}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ color: '#64748b', fontSize: '12px' }}>
                              No signatures yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultisigInteractScreen;
