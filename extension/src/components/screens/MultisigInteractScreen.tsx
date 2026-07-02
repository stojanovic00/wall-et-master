import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  TransactionData,
  useMultisigContract,
} from "../providers/MultisigContractProvider";
import { getMultisigTxs, addMultisigTx } from "../../utils/multisigStorage";
import LoadingScreen from "./LoadingScreen";
import { getTokenAddressBook } from "../../utils/tokenAddressBookStorage";
import { getAddressBook } from "../../utils/addressBookStorage";
import { useWallet } from "../providers/WalletProvider";

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
    proposeNative,
    proposeToken,
    depositNative,
    depositToken,
    sign,
    execute,
    getTransactionData,
    getMinSignatures,
    error: contractError,
  } = useMultisigContract();
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState<
    "propose" | "deposit" | "sign" | "execute" | "transactions"
  >("propose");
  const [proposeType, setProposeType] = useState<"native" | "token">("native");
  const [depositType, setDepositType] = useState<"native" | "token">("native");
  const [txs, setTxs] = useState<TransactionDataLocal[]>([]); // Transactions with details
  const [error, setError] = useState("");

  // Propose form state
  const [to, setTo] = useState("");
  const [value, setValue] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");

  // Deposit form state
  const [depositTxId, setDepositTxId] = useState("");
  const [depositValue, setDepositValue] = useState("");
  const [depositTokenAddress, setDepositTokenAddress] = useState("");

  // Sign/Execute form state (separate so switching tabs doesn't pre-populate the other)
  const [signTxId, setSignTxId] = useState("");
  const [executeTxId, setExecuteTxId] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"propose" | "deposit" | "sign" | "execute" | null>(null);
  const [minSignatures, setMinSignatures] = useState<number | null>(null);

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

  // Fetch transaction details for all hashes in local storage
  const fetchTransactions = async () => {
    const hashes = getMultisigTxs(contractAddress);
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
    setTxHashes(getMultisigTxs(contractAddress));
    // eslint-disable-next-line
  }, [contractAddress]);

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
    // Load recipient address book for datalist
    const addressBook = getAddressBook();
    setRecipientOptions(
      Object.entries(addressBook).map(([address, name]) => ({
        address,
        name: String(name),
      }))
    );
  }, [contractAddress]);

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
      if (!txHash) throw new Error("Failed to propose transaction");
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
    setLoading(true);
    setLoadingType("deposit");
    try {
      // Save depositTxId if not already saved and valid
      const existingTxs = getMultisigTxs(contractAddress);
      if (!existingTxs.includes(depositTxId)) {
        const txData = await getTransactionData(depositTxId);
        if (txData) {
          addMultisigTx(contractAddress, depositTxId);
        } else {
          throw new Error("Invalid transaction ID");
        }
      }
      if (depositType === "native") {
        const depositResult = await depositNative(depositTxId, ethers.parseEther(depositValue));
        if (!depositResult) {
          throw new Error("Native deposit failed");
        }
        onMultisigTransactionSuccess({
          transactionType: "deposit",
          txHash: depositTxId,
          contractAddress,
          transactionId: depositTxId,
          recipientAddress: undefined,
          amount: depositValue,
          tokenAddress: undefined,
          signerAddress: wallet?.address || "",
          chainId: 11155111, // Sepolia
          timestamp: Date.now(),
        });
      } else {
        if (!depositTokenAddress) return setError("Token address required");
        const depositResult = await depositToken(
          depositTxId,
          depositTokenAddress,
          ethers.parseEther(depositValue)
        );
        if (!depositResult) {
          throw new Error("Token deposit failed");
        }
        onMultisigTransactionSuccess({
          transactionType: "deposit",
          txHash: depositTxId,
          contractAddress,
          transactionId: depositTxId,
          recipientAddress: undefined,
          amount: depositValue,
          tokenAddress: depositTokenAddress,
          signerAddress: wallet?.address || "",
          chainId: 11155111, // Sepolia
          timestamp: Date.now(),
        });
      }
      setTxHashes(getMultisigTxs(contractAddress));
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
      if (!signResult) {
        throw new Error("Transaction signing failed");
      }

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
      if (!executeResult) {
        throw new Error("Transaction execution failed");
      }

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
      <div className="screen">
        <div className="multisig-content">
          <h2>Interact with MultiSig Contract</h2>
          <div className="form-group">
            <label>
              Contract Address:{" "}
              {contractAddress || (
                <span style={{ color: "red" }}>No contract address</span>
              )}
            </label>
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
          {(error || contractError) && (
            <div className="warning">{error || contractError}</div>
          )}
          {activeTab === "propose" && (
            <form onSubmit={handlePropose} className="margin-top-16">
              <div className="radio-group">
                <div className={`radio-option ${proposeType === "native" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    id="propose-native"
                    checked={proposeType === "native"}
                    onChange={() => setProposeType("native")}
                  />
                  <label htmlFor="propose-native">Native</label>
                </div>
                <div className={`radio-option ${proposeType === "token" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    id="propose-token"
                    checked={proposeType === "token"}
                    onChange={() => setProposeType("token")}
                  />
                  <label htmlFor="propose-token">Token</label>
                </div>
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
              <div className="radio-group">
                <div className={`radio-option ${depositType === "native" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    id="deposit-native"
                    checked={depositType === "native"}
                    onChange={() => setDepositType("native")}
                  />
                  <label htmlFor="deposit-native">Native</label>
                </div>
                <div className={`radio-option ${depositType === "token" ? "selected" : ""}`}>
                  <input
                    type="radio"
                    id="deposit-token"
                    checked={depositType === "token"}
                    onChange={() => setDepositType("token")}
                  />
                  <label htmlFor="deposit-token">Token</label>
                </div>
              </div>
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
              <div className="form-group">
                <label>
                  Value ({depositType === "native" ? "ETH" : "Token Amount"}):
                </label>
                <input
                  type="number"
                  className="input"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  placeholder="0.0"
                />
              </div>
              {depositType === "token" && (
                <div className="form-group">
                  <label>Token Address:</label>
                  <input
                    type="text"
                    className="input"
                    value={depositTokenAddress}
                    onChange={(e) => setDepositTokenAddress(e.target.value)}
                    placeholder="0x..."
                    list="token-address-list"
                  />
                  <datalist id="token-address-list">
                    {tokenAddressOptions.map((opt) => (
                      <option value={opt.address} key={opt.address}>
                        {opt.name} {opt.symbol ? `(${opt.symbol})` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
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
                                {selectedTx.native ? '🪙 Native ETH' : `🪙 ERC-20 Token`}
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
