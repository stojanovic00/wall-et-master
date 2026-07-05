import React from "react";
import { ethers } from "ethers";

export interface TransactionDetails {
  type: "eth-transfer" | "erc20-transfer" | "multisig-propose" | "multisig-sign" | "multisig-execute" | "multisig-deposit" | "recovery-deploy" | "recovery-action" | "token-approval" | "delegation-setup" | "delegation-revoke";
  to: string;
  from: string;
  value?: string;
  amount?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  gasPrice?: string;
  gasLimit?: number;
  estimatedFee?: string;
  contractAddress?: string;
  txHash?: string;
  functionName?: string;
  functionArgs?: any[];
  chainId?: number;
  data?: string;
  title?: string;
  description?: string;
}

interface TransactionConfirmationPromptProps {
  isOpen: boolean;
  transaction: TransactionDetails | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TransactionConfirmationPrompt: React.FC<TransactionConfirmationPromptProps> = ({
  isOpen,
  transaction,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen || !transaction) {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return amount;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "eth-transfer":
        return "ETH Transfer";
      case "erc20-transfer":
        return "Token Transfer";
      case "multisig-propose":
        return "Multisig Proposal";
      case "multisig-sign":
        return "Multisig Sign";
      case "multisig-execute":
        return "Multisig Execute";
      case "multisig-deposit":
        return "Multisig Deposit";
      case "recovery-deploy":
        return "Recovery Contract Deployment";
      case "recovery-action":
        return "Recovery Contract Action";
      case "token-approval":
        return "Token Approval";
      case "delegation-setup":
        return "Enable Smart Account";
      case "delegation-revoke":
        return "Disable Smart Account";
      default:
        return "Transaction";
    }
  };

  const getEstimatedFee = () => {
    if (transaction.estimatedFee) {
      return transaction.estimatedFee;
    }
    if (transaction.gasLimit && transaction.gasPrice) {
      const gasPriceWei = ethers.parseUnits(transaction.gasPrice, "gwei");
      const feeWei = BigInt(transaction.gasLimit) * gasPriceWei;
      return ethers.formatEther(feeWei);
    }
    return "Unknown";
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case "eth-transfer":
        return "💸";
      case "erc20-transfer":
        return "🪙";
      case "multisig-propose":
        return "📝";
      case "multisig-sign":
        return "✍️";
      case "multisig-execute":
        return "✅";
      case "multisig-deposit":
        return "💰";
      case "recovery-deploy":
        return "🏗️";
      case "recovery-action":
        return "🔄";
      case "token-approval":
        return "🔐";
      case "delegation-setup":
        return "🔗";
      case "delegation-revoke":
        return "🔓";
      default:
        return "📄";
    }
  };

  return (
    <div className="fixed-fullscreen-overlay">
      <div className="loading-content" style={{
        background: '#1a1f2e',
        padding: '32px',
        borderRadius: '12px',
        border: '2px solid #3b82f6',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
        textAlign: 'center',
        minWidth: '400px',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {getTransactionIcon()}
        </div>
        
        <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '20px' }}>
          {transaction.title || `Confirm ${getTransactionTypeLabel(transaction.type)}`}
        </h3>
        
        {transaction.description && (
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            {transaction.description}
          </p>
        )}

        <div style={{ 
          background: '#0f1419', 
          padding: '20px', 
          borderRadius: '8px', 
          border: '1px solid #334155',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          {/* Transaction Details */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>
              Transaction Details
            </h4>
            
            {transaction.to && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>To:</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontFamily: 'monospace' }}>
                  {formatAddress(transaction.to)}
                </span>
              </div>
            )}
            
            {transaction.from && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>From:</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontFamily: 'monospace' }}>
                  {formatAddress(transaction.from)}
                </span>
              </div>
            )}
            
            {transaction.amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Amount:</span>
                <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                  {transaction.tokenSymbol ? `${transaction.amount} ${transaction.tokenSymbol}` : `${transaction.amount} ETH`}
                </span>
              </div>
            )}
            
            {transaction.tokenAddress && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Token:</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontFamily: 'monospace' }}>
                  {transaction.tokenSymbol ? `${transaction.tokenSymbol} (${formatAddress(transaction.tokenAddress)})` : formatAddress(transaction.tokenAddress)}
                </span>
              </div>
            )}
            
            {transaction.contractAddress && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Contract:</span>
                <span style={{ color: '#3b82f6', fontSize: '14px', fontFamily: 'monospace' }}>
                  {formatAddress(transaction.contractAddress)}
                </span>
              </div>
            )}
            
            {transaction.estimatedFee && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Estimated Fee:</span>
                <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600' }}>
                  {getEstimatedFee()} ETH
                </span>
              </div>
            )}
          </div>
          
          {/* Warning */}
          <div style={{ 
            background: '#1e293b', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #475569'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>
              ⚠️ Please review the transaction details carefully before signing.
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              This action cannot be undone once confirmed.
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '100px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '100px'
            }}
          >
            {isLoading ? "Signing..." : "Sign Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionConfirmationPrompt; 