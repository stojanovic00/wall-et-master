import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../providers/WalletProvider";
import {
  addMultisigContract,
  getMultisigContracts,
  getMultisigInfo,
  removeMultisigContract,
} from "../../utils/multisigStorage";
import { getAddressBook } from "../../utils/addressBookStorage";

interface MultisigScreenProps {
  onBack: () => void;
  onOpenMultisigInteract: (addr: string) => void;
  onMultisigDeploymentSuccess: (deploymentData: {
    contractAddress: string;
    signers: string[];
    minSignatures: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  }) => void;
}

const MultisigScreen: React.FC<MultisigScreenProps> = ({
  onBack,
  onOpenMultisigInteract,
  onMultisigDeploymentSuccess,
}) => {
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [contractName, setContractName] = useState<string>("");
  const [minSignatures, setMinSignatures] = useState<number>(1);
  const [minSignaturesInput, setMinSignaturesInput] = useState<string>("1");
  const [error, setError] = useState<string>("");
  const [addressErrors, setAddressErrors] = useState<string[]>([""]);
  const { deployMultiSig, wallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [savedMultisigs, setSavedMultisigs] = useState<
    { address: string; name?: string }[]
  >([]);
  const [customMultisig, setCustomMultisig] = useState<string>("");
  const [customMultisigError, setCustomMultisigError] = useState<string>("");
  const [addressBook, setAddressBook] = useState<
    { address: string; name: string }[]
  >([]);

  const loadSavedMultisigs = () => {
    setSavedMultisigs(
      getMultisigContracts().map((address) => ({
        address,
        name: getMultisigInfo(address)?.name,
      }))
    );
  };

  useEffect(() => {
    loadSavedMultisigs();
    // Load address book
    const book = getAddressBook();
    setAddressBook(
      Object.entries(book).map(([address, name]) => ({
        address,
        name: String(name),
      }))
    );
  }, []);

  // Validate all addresses, including duplicates
  const validateAddresses = (addrs: string[]) => {
    return addrs.map((addr, idx) => {
      if (!addr.trim()) return "";
      if (!ethers.isAddress(addr.trim())) return "Invalid address";
      // Check for duplicates (case-insensitive)
      const lower = addr.trim().toLowerCase();
      const firstIdx = addrs.findIndex((a) => a.trim().toLowerCase() === lower);
      if (firstIdx !== idx) return "Duplicate address";
      return "";
    });
  };

  const handleAddressChange = (idx: number, value: string) => {
    const arr = [...addresses];
    arr[idx] = value;
    setAddresses(arr);
    const errors = validateAddresses(arr);
    setAddressErrors(errors);
    // Don't touch minSignatures - let user set whatever they want >= 1
  };

  const handleAddAddress = () => {
    // Prevent adding if last address is not valid or is duplicate
    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    if (addresses.length > 0) {
      const lastIdx = addresses.length - 1;
      if (!addresses[lastIdx].trim() || errors[lastIdx]) {
        setError("Please enter a valid, unique address before adding another.");
        return;
      }
    }
    setAddresses([...addresses, ""]);
    setAddressErrors([...addressErrors, ""]);
    setError("");
  };

  const handleRemoveAddress = (idx: number) => {
    const arr = addresses.filter((_, i) => i !== idx);
    const errors = addressErrors.filter((_, i) => i !== idx);
    setAddresses(arr);
    setAddressErrors(errors);
    // Don't touch minSignatures - let user set whatever they want >= 1
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const errors = validateAddresses(addresses);
      setAddressErrors(errors);
      const filtered = addresses.filter(
        (addr, i) => addr.trim() !== "" && errors[i] === ""
      );
      if (filtered.length === 0) {
        setError("At least one valid address is required.");
        setIsLoading(false);
        return;
      }
      if (errors.some((err, i) => addresses[i].trim() && err)) {
        setError("Please fix invalid or duplicate addresses.");
        setIsLoading(false);
        return;
      }
      if (minSignatures < 1) {
        setError("Minimum signatures must be at least 1.");
        setIsLoading(false);
        return;
      }
      if (minSignatures > filtered.length) {
        setError("Minimum signatures cannot exceed number of valid addresses.");
        setIsLoading(false);
        return;
      }
      
      setError("");
      const multiSigAddress = await deployMultiSig(filtered, minSignatures);
      addMultisigContract(multiSigAddress, {
        name: contractName.trim() || undefined,
        signers: filtered,
        minSignatures,
      });
      loadSavedMultisigs();
      onMultisigDeploymentSuccess({
        contractAddress: multiSigAddress,
        signers: filtered,
        minSignatures: minSignatures,
        deployerAddress: wallet?.address || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a custom multisig address to the saved list if valid and not already present
  const handleAddCustomMultisig = () => {
    const addr = customMultisig.trim();
    if (!addr) {
      setCustomMultisigError("");
      return;
    }
    if (!ethers.isAddress(addr)) {
      setCustomMultisigError("Invalid address");
      return;
    }
    setCustomMultisigError("");
    if (!savedMultisigs.some((m) => m.address === addr)) {
      addMultisigContract(addr);
      loadSavedMultisigs();
    }
    setCustomMultisig("");
    onOpenMultisigInteract(addr);
  };

  // Remove a multisig address from the saved list
  const handleRemoveSavedMultisig = (addr: string) => {
    removeMultisigContract(addr);
    loadSavedMultisigs();
  };

  return (
    <div className="container">
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
              🏗️ Deploying Multisig Contract...
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your multisig contract is being deployed to the blockchain.
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
          <h2>Deploy MultiSig Contract</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Contract Name (optional):</label>
              <input
                type="text"
                className="input"
                value={contractName}
                placeholder="e.g. Team Treasury"
                onChange={(e) => setContractName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Addresses:</label>
              {addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="flex-align-center-gap-8 margin-bottom-8"
                >
                  <input
                    type="text"
                    className="input"
                    value={addr}
                    placeholder={`Address #${idx + 1}`}
                    onChange={(e) => handleAddressChange(idx, e.target.value)}
                    disabled={isLoading}
                    list="address-book-list"
                  />
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon margin-left-8"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleRemoveAddress(idx)}
                      title="Remove address"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  )}
                  {addressErrors[idx] && addr.trim() && (
                    <span className="warning margin-left-8">
                      {addressErrors[idx]}
                    </span>
                  )}
                </div>
              ))}
              <datalist id="address-book-list">
                {addressBook.map(({ address, name }) => (
                  <option
                    value={address}
                    key={address}
                    label={name ? `${address} (${name})` : address}
                  />
                ))}
              </datalist>
              <button
                type="button"
                className="btn btn-secondary margin-top-8"
                onClick={handleAddAddress}
                style={{ marginTop: 8 }}
                disabled={isLoading}
              >
                Add Address
              </button>
            </div>
            <div className="form-group">
              <label>Minimum Signatures Required:</label>
              <input
                type="number"
                className="input"
                min={1}
                value={minSignaturesInput}
                onChange={(e) => {
                  setMinSignaturesInput(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1) {
                    setMinSignatures(val);
                  }
                }}
                disabled={isLoading}
              />
            </div>
            {error && <div className="warning">{error}</div>}
            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Deploying..." : "Deploy Multisig"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </form>
        </div>

        {/* Multisig Interact Section */}
        <div className="multisig-interact margin-bottom-24">
          <h3>Interact with MultiSig Contract</h3>
          <div className="flex-align-center-gap-8">
            <input
              list="saved-multisigs-list"
              className="input width-340"
              placeholder="Enter or select multisig address"
              value={customMultisig}
              onChange={(e) => {
                setCustomMultisig(e.target.value);
                if (e.target.value && !ethers.isAddress(e.target.value)) {
                  setCustomMultisigError("Invalid address");
                } else {
                  setCustomMultisigError("");
                }
              }}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomMultisig();
                }
              }}
            />
            <datalist id="saved-multisigs-list">
              {savedMultisigs.map(({ address, name }) => (
                <option value={address} key={address} label={name} />
              ))}
            </datalist>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddCustomMultisig}
              disabled={isLoading || !customMultisig || !!customMultisigError}
            >
              Go
            </button>
          </div>
          {customMultisigError && (
            <div className="warning margin-top-4">{customMultisigError}</div>
          )}
        </div>
        {/* Saved Multisigs Management Section */}
        {savedMultisigs.length > 0 && (
          <div className="saved-multisigs margin-bottom-24">
            <h4>Saved MultiSig Contracts</h4>
            <div className="multisig-contracts-list">
              {savedMultisigs.map(({ address, name }, idx) => (
                <div
                  key={address}
                  className="multisig-contract-card"
                  onClick={() => onOpenMultisigInteract(address)}
                  title="Click to open multisig contract"
                >
                  <div className="multisig-contract-info">
                    <span className="multisig-contract-number">
                      {name || `Contract #${idx + 1}`}
                    </span>
                    <span className="multisig-contract-address">
                      {address}
                    </span>
                  </div>
                  <div className="multisig-contract-actions">
                    <button
                      type="button"
                      className="multisig-delete-btn"
                      title="Remove from saved"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSavedMultisig(address);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultisigScreen;
