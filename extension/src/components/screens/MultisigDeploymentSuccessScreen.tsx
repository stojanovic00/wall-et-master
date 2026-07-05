import React from "react";
import { MdContentCopy } from "react-icons/md";

interface MultisigDeploymentSuccessScreenProps {
  contractAddress: string;
  signers: string[];
  minSignatures: number;
  deployerAddress: string;
  chainId: number;
  timestamp: number;
  onClose: () => void;
  onOpenMultisigInteract: (addr: string) => void;
}

const MultisigDeploymentSuccessScreen: React.FC<MultisigDeploymentSuccessScreenProps> = ({
  contractAddress,
  signers,
  minSignatures,
  deployerAddress,
  chainId,
  timestamp,
  onClose,
  onOpenMultisigInteract,
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="screen">
      <div className="transaction-success-content">
        <div className="success-header">
          <h2>✅ Multisig Contract Deployed Successfully</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="transaction-details">
          <div className="detail-section">
            <h3>Contract Address</h3>
            <div className="hash-container">
              <span className="hash-text">{contractAddress}</span>
              <button
                className="btn-icon"
                onClick={() => copyToClipboard(contractAddress)}
                title="Copy contract address"
              >
                <MdContentCopy size={16} />
              </button>
            </div>
          </div>

          <div className="detail-section">
            <h3>Contract Configuration</h3>
            <div className="detail-row">
              <span>Minimum Signatures:</span>
              <span>{minSignatures}</span>
            </div>
            <div className="detail-row">
              <span>Total Signers:</span>
              <span>{signers.length}</span>
            </div>
            <div className="detail-row">
              <span>Deployer:</span>
              <div className="address-container">
                <span className="address-text">{deployerAddress}</span>
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(deployerAddress)}
                  title="Copy deployer address"
                >
                  <MdContentCopy size={14} />
                </button>
              </div>
            </div>
            <div className="detail-row">
              <span>Deployment Time:</span>
              <span>{formatTimestamp(timestamp)}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>Signer Addresses</h3>
            {signers.map((signer, index) => (
              <div key={signer} className="detail-row">
                <span>
                  Signer {index + 1}
                  {signer.toLowerCase() === deployerAddress.toLowerCase() ? " (You)" : ""}:
                </span>
                <div className="address-container">
                  <span className="address-text">{signer}</span>
                  <button
                    className="btn-icon"
                    onClick={() => copyToClipboard(signer)}
                    title="Copy signer address"
                  >
                    <MdContentCopy size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="detail-section">
            <h3>Network</h3>
            <div className="detail-row">
              <span>Chain ID:</span>
              <span>{chainId} {chainId === 11155111 ? "(Sepolia)" : "(Mainnet)"}</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => onOpenMultisigInteract(contractAddress)}
          >
            Open Multisig Contract
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Back to Multisig Management
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultisigDeploymentSuccessScreen; 