import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";
import {
  addToAddressBook,
  getAddressBook,
} from "../../utils/addressBookStorage";
import {
  addToTokenAddressBook,
  getTokenAddressBook,
} from "../../utils/tokenAddressBookStorage";
import { useToken } from "../providers/TokenProvider";

interface SendErc20ScreenProps {
  onBack: () => void;
  onTransactionSuccess: (txData: {
    txHash: string;
    receipt: any;
    from: string;
    to: string;
    amount: string;
    gasPrice: string;
    gasLimit: number;
    chainId: number;
    timestamp: number;
  }) => void;
}

const SendErc20Screen: React.FC<SendErc20ScreenProps> = ({ onBack, onTransactionSuccess }) => {
  const { wallet, sendErc20Transaction } = useWallet();
  const { getTokenInfo } = useToken();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [totalAmount, setTotalAmount] = useState("0");
  const [tokenAddressBook, setTokenAddressBook] = useState<{
    [address: string]: { name: string; symbol: string; decimals: number };
  }>({});
  const [addressBook, setAddressBook] = useState<{ [address: string]: string }>(
    {}
  );

  // Calculate estimated fee and total amount
  const calculateFees = () => {
    const gasPriceNum = parseInt(gasPrice) || 20;
    const gasLimit = 60000; // Typical for ERC20 transfer
    const feeWei = gasLimit * (gasPriceNum * 1e9); // Convert gwei to wei
    const feeEth = feeWei / 1e18; // Convert wei to ETH
    setEstimatedFee(feeEth.toFixed(6));
    setTotalAmount(feeEth.toFixed(6)); // Only fee in ETH, token is separate
  };

  useEffect(() => {
    calculateFees();
  }, [amount, gasPrice]);

  useEffect(() => {
    setTokenAddressBook(getTokenAddressBook());
    const book = getAddressBook();
    if (wallet && !book[wallet.address]) {
      book[wallet.address] = "You";
    }
    setAddressBook(book);
  }, [wallet]);

  const handleSend = async () => {
    if (!wallet) {
      setError("No wallet loaded");
      return;
    }
    if (!recipientAddress.trim()) {
      setError("Please enter recipient address");
      return;
    }
    if (!tokenAddress.trim()) {
      setError("Please enter token contract address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const addressBook = getAddressBook();
      if (!addressBook[recipientAddress.trim()]) {
        addToAddressBook(recipientAddress.trim(), "no name");
      }

      const tokenAddressBook = getTokenAddressBook();
      let tokenInfo = tokenAddressBook[tokenAddress.trim()];
      if (!tokenInfo) {
        tokenInfo = await getTokenInfo(tokenAddress.trim());

        if (tokenInfo) {
          addToTokenAddressBook(
            tokenAddress.trim(),
            tokenInfo.name,
            tokenInfo.symbol,
            tokenInfo.decimals
          );
        }
      }

      const { txHash, receipt } = await sendErc20Transaction(
        tokenAddress.trim(),
        recipientAddress.trim(),
        amount,
        tokenInfo.decimals,
        gasPrice
      );

      console.log("ERC20 Transaction sent successfully:", {
        txHash,
        receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        token: tokenAddress.trim(),
        amount,
        gasPrice,
        gasLimit: 60000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      onTransactionSuccess({
        txHash,
        receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        amount,
        gasPrice,
        gasLimit: 60000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setRecipientAddress("");
      setTokenAddress("");
      setAmount("");
      setGasPrice("20");
    } catch (error) {
      console.error("Error sending ERC20 transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send transaction"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen">
      {isLoading && (
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
              🪙 Sending ERC20 Token...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your ERC20 token transaction is being processed on the blockchain.
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
      <div className="send-content">
        <h2>Send ERC20 Token</h2>
        <div className="form-group">
          <label htmlFor="token-address">Token Contract Address:</label>
          <input
            type="text"
            id="token-address"
            className="input"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            list="token-address-list"
          />
          <datalist id="token-address-list">
            {Object.entries(tokenAddressBook).map(([address, info]) => (
              <option key={address} value={address}>
                {info.name} ({info.symbol})
              </option>
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="recipient-address">Recipient Address:</label>
          <input
            type="text"
            id="recipient-address"
            className="input"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            list="recipient-address-list"
          />
          <datalist id="recipient-address-list">
            {Object.entries(addressBook).map(([address, name]) => (
              <option key={address} value={address}>
                {name}
              </option>
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor="amount">Amount (Token Units):</label>
          <input
            type="number"
            id="amount"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.001"
            min="0"
          />
        </div>
        <div className="transaction-summary">
          <div className="summary-item">
            <span>Estimated Fee:</span>
            <span>{estimatedFee} ETH</span>
          </div>
          <div className="summary-item">
            <span>Total ETH Needed:</span>
            <span>{totalAmount} ETH</span>
          </div>
        </div>
        {error && <div className="warning">{error}</div>}
        <div className="button-group">
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={
              isLoading ||
              !recipientAddress.trim() ||
              !tokenAddress.trim() ||
              !amount ||
              parseFloat(amount) <= 0
            }
          >
            {isLoading ? "Sending Transaction..." : "Send Token"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onBack}
            disabled={isLoading}
          >
            Back to Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendErc20Screen;
