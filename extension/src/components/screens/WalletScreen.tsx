import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";
import { MdContentCopy } from "react-icons/md";

interface WalletScreenProps {
  onSendEth: () => void;
  onSendErc20: () => void;
  onUploadMultisig: () => void;
  onViewTokens: () => void;
  onViewAddressBook: () => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  onSendEth,
  onSendErc20,
  onUploadMultisig,
  onViewTokens,
  onViewAddressBook,
}) => {
  const { wallet, address, getBalance, isDelegationActive, enableSmartAccount, disableSmartAccount } = useWallet();
  const [balance, setBalance] = useState<string>("");
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [delegationError, setDelegationError] = useState<string>("");

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet) {
        setLoadingBalance(true);
        try {
          const bal = await getBalance();
          setBalance(bal);
        } catch (e) {
          setBalance("Error");
        } finally {
          setLoadingBalance(false);
        }
      } else {
        setBalance("");
      }
    };
    fetchBalance();
  }, [wallet, getBalance]);

  const handleDelegationToggle = async () => {
    setDelegationLoading(true);
    setDelegationError("");
    try {
      if (isDelegationActive) {
        await disableSmartAccount();
      } else {
        await enableSmartAccount();
      }
    } catch (e: any) {
      setDelegationError(e.message || "Transaction failed");
    } finally {
      setDelegationLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!wallet) {
    return <div>No wallet loaded</div>;
  }

  return (
    <div className="screen">
      <div className="wallet-content">
        <div className="balance-section margin-bottom-1em">
          <div className="font-bold-1-5em">
            Balance:{" "}
            {loadingBalance
              ? "Loading..."
              : balance !== ""
              ? `${balance} ETH`
              : "--"}
          </div>
        </div>

        <div className="address-section">
          <label>Wallet Address:</label>
          <div className="input-group">
            <input
              type="text"
              id="wallet-address"
              className="input"
              value={address}
              readOnly
            />
            <button
              className={`btn-icon ${copied ? "copy-copied" : undefined}`}
              onClick={() => copyToClipboard(address)}
              title="Copy address"
              style={{
                display: "flex",
                alignItems: "center",
                minWidth: 60,
                justifyContent: "center",
              }}
            >
              {copied ? (
                <span style={{ color: "green", fontWeight: 600 }}>Copied</span>
              ) : (
                <MdContentCopy
                  size={20}
                  color="#1d427d"
                  className="copy-icon-margin"
                />
              )}
            </button>
          </div>
        </div>

        <div className="wallet-actions">
          <button className="btn btn-primary" onClick={onSendEth}>
            Send ETH
          </button>
          <button
            className={`btn btn-primary margin-top-8`}
            onClick={onSendErc20}
            style={{ marginTop: 8 }}
          >
            Send ERC20 Token
          </button>
          <button className="btn btn-secondary" onClick={onViewTokens}>
            Tokens
          </button>
          <button className="btn btn-secondary" onClick={onViewAddressBook}>
            Address Book
          </button>
          <hr className="hr-wallet" />
          <div className="smart-account-section">
            <div className="smart-account-header">
              <span className="smart-account-label">
                Smart Account (EIP-7702)
              </span>
              <div
                className={`toggle ${isDelegationActive ? "toggle-on" : "toggle-off"} ${delegationLoading ? "toggle-disabled" : ""}`}
                onClick={!delegationLoading ? handleDelegationToggle : undefined}
              >
                <div className="toggle-thumb" />
              </div>
            </div>
            <p className="smart-account-desc">
              {isDelegationActive
                ? "Enabled - ERC20 deposits use a single transaction"
                : "Disabled - ERC20 deposits require two transactions"}
            </p>
            {delegationLoading && (
              <p className="smart-account-loading">Sending transaction...</p>
            )}
            {delegationError && (
              <p className="smart-account-error">{delegationError}</p>
            )}
          </div>
          <hr className="hr-wallet" />
          <button className="btn btn-secondary" onClick={onUploadMultisig}>
            Multisig Contracts Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletScreen;
