import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";
import {
  AddressBook,
  addToAddressBook,
  getAddressBook,
} from "../../utils/addressBookStorage";

interface SendScreenProps {
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

const SendScreen: React.FC<SendScreenProps> = ({ onBack, onTransactionSuccess }) => {
  const { wallet, sendTransaction } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPrice, setGasPrice] = useState("20");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [totalAmount, setTotalAmount] = useState("0");
  const [addressBook, setAddressBook] = useState<{ [address: string]: string }>(
    {}
  );

  // Calculate estimated fee and total amount
  const calculateFees = () => {
    const amountNum = parseFloat(amount) || 0;
    const gasPriceGwei = 20; // Fixed gas price for Sepolia
    const gasLimit = 210000; // Standard for ETH transfer

    // Calculate fee in ETH
    const feeWei = gasLimit * (gasPriceGwei * 1e9); // Convert gwei to wei
    const feeEth = feeWei / 1e18; // Convert wei to ETH

    setEstimatedFee(feeEth.toFixed(6));
    setTotalAmount((amountNum + feeEth).toFixed(6));
  };

  // Update calculations when amount changes
  useEffect(() => {
    calculateFees();
  }, [amount]);

  useEffect(() => {
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
      // Send the transaction to the network
      const { txHash, receipt } = await sendTransaction(
        recipientAddress.trim(),
        amount,
        gasPrice
      );

      // Log the transaction data
      console.log("Transaction sent successfully:", {
        txHash: txHash,
        receipt: receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        amount: amount,
        gasPrice: gasPrice,
        gasLimit: 210000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });

      // Clear form
      setRecipientAddress("");
      setAmount("");
      setGasPrice("20");

      onTransactionSuccess({
        txHash,
        receipt,
        from: wallet.address,
        to: recipientAddress.trim(),
        amount,
        gasPrice,
        gasLimit: 210000,
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error sending transaction:", error);
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
              💸 Sending ETH Transaction...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your ETH transaction is being processed on the blockchain.
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
        <h2>Send ETH</h2>

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
          <label htmlFor="amount">Amount (ETH):</label>
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
            <span>Total Amount:</span>
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
              !amount ||
              parseFloat(amount) <= 0
            }
          >
            {isLoading ? "Sending Transaction..." : "Send Transaction"}
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

export default SendScreen;
