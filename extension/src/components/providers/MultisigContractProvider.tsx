import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import MultiSigJson from "../../../contracts/MultiSig.json";
import { useWallet } from "./WalletProvider";
import {
  depositTokenWithDelegation,
  depositTokenClassic,
  approveTokenClassic,
  GENEROUS_FEE_OVERRIDES,
} from "../../utils/multisig";
import { config } from "../../config";

// Ethers surfaces the on-chain revert reason (from a plain require(...,"msg"))
// in err.reason or err.shortMessage - prefer those over the full raw error,
// which is often a long technical dump unsuitable for showing to a user.
function friendlyErrorMessage(err: any): string {
  return err?.reason || err?.shortMessage || err?.message || "Transaction failed";
}

interface MultisigContractContextType {
  contract: ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  proposeNative: (to: string, amount: ethers.BigNumberish) => Promise<any>;
  proposeToken: (
    to: string,
    amount: ethers.BigNumberish,
    token: string
  ) => Promise<any>;
  sign: (txHash: string) => Promise<boolean | undefined>;
  execute: (txHash: string) => Promise<boolean | undefined>;
  depositNative: (
    txHash: string,
    value: ethers.BigNumberish
  ) => Promise<boolean | undefined>;
  depositToken: (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => Promise<boolean | undefined>;
  approveTokenForDeposit: (
    token: string,
    amount: ethers.BigNumberish
  ) => Promise<boolean>;
  finalizeTokenDeposit: (
    txHash: string,
    amount: ethers.BigNumberish
  ) => Promise<boolean>;
  getTransactionData: (txHash: string) => Promise<TransactionData | null>;
  getMinSignatures: () => Promise<number | null>;
}

const MultisigContractContext = createContext<
  MultisigContractContextType | undefined
>(undefined);

interface MultisigContractProviderProps {
  contractAddress: string;
  children: ReactNode;
}

export interface TransactionData {
  to: string;
  native: boolean;
  token: string;
  amount: ethers.BigNumberish;
  proposer: string;
  timestamp: ethers.BigNumberish;
  signedCount: ethers.BigNumberish;
  executed: boolean;
  balance: ethers.BigNumberish;
}

export const MultisigContractProvider: React.FC<
  MultisigContractProviderProps
> = ({ contractAddress, children }) => {
  const { wallet } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeContract = async () => {
      if (!contractAddress || !wallet) {
        setContract(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Initializing contract with address:", contractAddress);
        console.log("Contract ABI:", MultiSigJson.abi);
        
        const contractInstance = new ethers.Contract(
          contractAddress,
          MultiSigJson.abi,
          wallet
        );
        
        console.log("Contract instance created:", contractInstance);
        
        // Test if the contract exists by calling a simple view function
        try {
          const testResult = await contractInstance.minSignatures();
          console.log("Contract test successful, minSignatures:", testResult);
          
          // Also test if the current wallet is a signer
          const isSigner = await contractInstance.isSigner(wallet.address);
          console.log("Current wallet is signer:", isSigner);
          
          if (!isSigner) {
            console.warn("Warning: Current wallet is not a signer of this multisig contract");
          }
          
        } catch (testErr: any) {
          console.error("Contract test failed:", testErr);
          setError(`Contract test failed: ${friendlyErrorMessage(testErr)}`);
          setContract(null);
          setIsLoading(false);
          return;
        }
        
        setContract(contractInstance);
      } catch (err: any) {
        console.error("Error initializing contract:", err);
        setError(friendlyErrorMessage(err));
        setContract(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContract();
  }, [contractAddress, wallet]);

  // Contract methods
  const proposeNative = async (to: string, amount: ethers.BigNumberish) => {
    if (!contract) {
      console.error("No contract available for proposeNative");
      return null;
    }
    try {
      setError(null);
      console.log("Proposing native transaction to:", to, "amount:", amount);
      console.log("Contract address:", await contract.getAddress());
      console.log("Wallet address:", wallet?.address);

      // Check if the caller is a signer
      const isSigner = await contract.isSigner(wallet?.address);
      console.log("Is caller a signer:", isSigner);

      if (!isSigner) {
        throw new Error("Caller is not a signer of this multisig contract");
      }

      const tx = await contract["proposeNative(address,uint256)"](to, amount);
      console.log("Transaction sent, hash:", tx.hash, "waiting for receipt...");
      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }

      console.log("Transaction receipt:", receipt);

      let txHash: string | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "Propose") {
            txHash = parsed.args[0];
            break;
          }
        } catch {}
      }
      if (!txHash) throw new Error("Could not retrieve transaction hash from Propose event");
      console.log("Transaction hash from Propose event:", txHash);

      return txHash;
    } catch (err: any) {
      console.error("Error in proposeNative:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        transaction: err.transaction
      });
      setError(friendlyErrorMessage(err));
      return null;
    }
  };

  const proposeToken = async (
    to: string,
    amount: ethers.BigNumberish,
    token: string
  ) => {
    if (!contract) {
      console.error("No contract available for proposeToken");
      return null;
    }
    try {
      setError(null);
      console.log("Proposing token transaction to:", to, "amount:", amount, "token:", token);
      console.log("Contract address:", await contract.getAddress());
      console.log("Wallet address:", wallet?.address);

      // Check if the caller is a signer
      const isSigner = await contract.isSigner(wallet?.address);
      console.log("Is caller a signer:", isSigner);

      if (!isSigner) {
        throw new Error("Caller is not a signer of this multisig contract");
      }

      const tx = await contract["proposeToken(address,uint256,address)"](
        to,
        amount,
        token
      );
      console.log("Transaction sent, hash:", tx.hash, "waiting for receipt...");
      const receipt = await tx.wait();
      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }
      console.log("Transaction receipt:", receipt);

      let txHash: string | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === "Propose") {
            txHash = parsed.args[0];
            break;
          }
        } catch {}
      }
      if (!txHash) throw new Error("Could not retrieve transaction hash from Propose event");
      console.log("Transaction hash from Propose event:", txHash);

      return txHash;
    } catch (err: any) {
      console.error("Error in proposeToken:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        transaction: err.transaction
      });
      setError(friendlyErrorMessage(err));
      return null;
    }
  };

  const sign = async (txHash: string) => {
    if (!contract) return;
    try {
      setError(null);
      console.log("Signing transaction:", txHash);
      console.log("Contract address:", await contract.getAddress());
      console.log("Wallet address:", wallet?.address);
      
      // Check if the caller is a signer
      const isSigner = await contract.isSigner(wallet?.address);
      console.log("Is caller a signer:", isSigner);

      if (!isSigner) {
        throw new Error("Caller is not a signer of this multisig contract");
      }

      // Get transaction data to validate before signing
      const txData = await contract["getTransaction(bytes32)"](txHash);
      console.log("Transaction data:", txData);

      if (txData.proposer === ethers.ZeroAddress) {
        throw new Error("Transaction not found");
      }

      if (txData.executed) {
        throw new Error("Transaction already executed");
      }

      // Check if already signed
      const hasSigned = await contract["hasSignedTx(address,bytes32)"](wallet?.address, txHash);
      if (hasSigned) {
        throw new Error("Transaction already signed by this address");
      }

      const tx = await contract["sign(bytes32)"](txHash);
      console.log("Sign transaction sent, hash:", tx.hash, "waiting for receipt...");
      const receipt = await tx.wait();
      console.log("Sign receipt:", receipt);

      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }

      // Verify the signature was actually recorded
      const updatedTxData = await contract["getTransaction(bytes32)"](txHash);
      const updatedHasSigned = await contract["hasSignedTx(address,bytes32)"](wallet?.address, txHash);
      
      if (!updatedHasSigned) {
        throw new Error("Transaction signing failed - signature not recorded");
      }
      
      console.log("Transaction signed successfully. New signature count:", updatedTxData.signedCount);
      return true;
    } catch (err: any) {
      console.error("Error in sign:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        transaction: err.transaction
      });
      setError(friendlyErrorMessage(err));
      return false;
    }
  };

  const execute = async (txHash: string) => {
    if (!contract) return;
    try {
      setError(null);
      console.log("Executing transaction:", txHash);
      console.log("Contract address:", await contract.getAddress());
      console.log("Wallet address:", wallet?.address);
      
      // Check if the caller is a signer
      const isSigner = await contract.isSigner(wallet?.address);
      console.log("Is caller a signer:", isSigner);

      if (!isSigner) {
        throw new Error("Caller is not a signer of this multisig contract");
      }

      // Get transaction data to validate before execution
      const txData = await contract["getTransaction(bytes32)"](txHash);
      console.log("Transaction data before execution:", txData);
      
      if (txData.proposer === ethers.ZeroAddress) {
        throw new Error("Transaction not found");
      }
      
      if (txData.executed) {
        throw new Error("Transaction already executed");
      }
      
      const minSig = await contract.minSignatures();
      console.log("Min signatures required:", minSig);
      console.log("Current signatures:", txData.signedCount);

      if (txData.signedCount < minSig) {
        throw new Error(
          `Not enough signatures to execute this transaction (${txData.signedCount} of ${minSig} required).`
        );
      }

      // Pre-check funds the same way the contract itself does, so a clean
      // message shows up before ever attempting the transaction.
      if ((txData.balance as bigint) < (txData.amount as bigint)) {
        let decimals = 18;
        if (!txData.native) {
          try {
            const tokenContract = new ethers.Contract(
              txData.token,
              ["function decimals() view returns (uint8)"],
              wallet
            );
            decimals = Number(await tokenContract.decimals());
          } catch {}
        }
        const unit = txData.native ? "ETH" : "tokens";
        const missing = (txData.amount as bigint) - (txData.balance as bigint);
        throw new Error(
          `Not enough funds deposited yet. This transaction needs ${ethers.formatUnits(txData.amount, decimals)} ${unit}, but only ${ethers.formatUnits(txData.balance, decimals)} ${unit} has been deposited so far (${ethers.formatUnits(missing, decimals)} ${unit} still needed).`
        );
      }

      console.log("All pre-execution checks passed. Sending execute transaction...");
      const tx = await contract["execute(bytes32)"](txHash, GENEROUS_FEE_OVERRIDES);
      console.log("Execute transaction sent, hash:", tx.hash, "waiting for receipt...");
      const receipt = await tx.wait();
      console.log("Execute receipt:", receipt);
      
      if (receipt.status !== 1) {
        throw new Error("Transaction failed with status: " + receipt.status);
      }
      
      console.log("Transaction executed successfully");
      return true;
    } catch (err: any) {
      console.error("Error in execute:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        data: err.data,
        transaction: err.transaction
      });
      setError(friendlyErrorMessage(err));
      return false;
    }
  };

  const depositNative = async (txHash: string, value: ethers.BigNumberish) => {
    if (!contract) return;
    try {
      setError(null);
      const tx = await contract["depositNative(bytes32)"](txHash, {
        value: value,
      });
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
    }
  };

  // Bundled path: used when Smart Account (EIP-7702 delegation) is active -
  // approve + deposit happen atomically in a single transaction.
  const depositToken = async (
    txHash: string,
    token: string,
    amount: ethers.BigNumberish
  ) => {
    if (!contract || !wallet) return;
    try {
      setError(null);
      const multisigContractAddress = await contract.getAddress();
      console.log("Smart account active - single tx deposit");
      await depositTokenWithDelegation(wallet, token, multisigContractAddress, txHash, amount);
      return true;
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
      return false;
    }
  };

  // Classic path, step 1/2: used when Smart Account is inactive - approves
  // the multisig contract to spend the token, as its own confirmable transaction.
  const approveTokenForDeposit = async (
    token: string,
    amount: ethers.BigNumberish
  ) => {
    if (!contract || !wallet) return false;
    try {
      setError(null);
      const multisigContractAddress = await contract.getAddress();
      await approveTokenClassic(wallet, token, multisigContractAddress, amount);
      return true;
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
      return false;
    }
  };

  // Classic path, step 2/2: deposits the already-approved amount, as its own
  // confirmable transaction.
  const finalizeTokenDeposit = async (
    txHash: string,
    amount: ethers.BigNumberish
  ) => {
    if (!contract || !wallet) return false;
    try {
      setError(null);
      const multisigContractAddress = await contract.getAddress();
      await depositTokenClassic(wallet, multisigContractAddress, txHash, amount);
      return true;
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
      return false;
    }
  };

  const getTransactionData = async (txHash: string) => {
    if (!contract) return null;
    try {
      const data = await contract["getTransaction(bytes32)"](txHash);
      return data as TransactionData;
    } catch (err: any) {
      setError(friendlyErrorMessage(err));
      return null;
    }
  };

  const getMinSignatures = async () => {
    if (!contract) return null;
    try {
      console.log("Calling minSignatures on contract:", await contract.getAddress());
      const result = await contract.minSignatures();
      console.log("minSignatures result:", result);
      return Number(result);
    } catch (err: any) {
      console.error("Error calling minSignatures:", err);
      setError(friendlyErrorMessage(err));
      return null;
    }
  };

  const value = useMemo(
    () => ({
      contract,
      isLoading,
      error,
      proposeNative,
      proposeToken,
      sign,
      execute,
      depositNative,
      depositToken,
      approveTokenForDeposit,
      finalizeTokenDeposit,
      getTransactionData,
      getMinSignatures,
    }),
    [contract, isLoading, error]
  );

  return (
    <MultisigContractContext.Provider value={value}>
      {children}
    </MultisigContractContext.Provider>
  );
};

export const useMultisigContract = () => {
  const context = useContext(MultisigContractContext);
  if (context === undefined) {
    throw new Error(
      "useMultisigContract must be used within a MultisigContractProvider"
    );
  }
  return context;
};
