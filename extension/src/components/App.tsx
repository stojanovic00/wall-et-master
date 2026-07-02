import React, { useState, useEffect } from "react";
import { useWallet } from "./providers/WalletProvider";
import SetupScreen from "./screens/SetupScreen";
import ImportScreen from "./screens/ImportScreen";
import GeneratedWalletScreen from "./screens/GeneratedWalletScreen";
import WalletScreen from "./screens/WalletScreen";
import SendScreen from "./screens/SendScreen";
import LoadingScreen from "./screens/LoadingScreen";
import PasswordSetupScreen from "./screens/PasswordSetupScreen";
import PasswordUnlockScreen from "./screens/PasswordUnlockScreen";
import ViewPrivateKeyScreen from "./screens/ViewPrivateKeyScreen";
import SignOutScreen from "./screens/SignOutScreen";
import Navbar from "./navbar/Navbar";
import MultisigScreen from "./screens/MultisigScreen";
import { Screen } from "../types";
import MultisigInteractScreen from "./screens/MultisigInteractScreen";
import { MultisigContractProvider } from "./providers/MultisigContractProvider";
import SendErc20Screen from "./screens/SendErc20Screen";
import TokenScreen from "./screens/TokenScreen";
import { TokenProvider } from "./providers/TokenProvider";
import AddressBookScreen from "./screens/AddressBookScreen";
import TransactionSuccessScreen from "./screens/TransactionSuccessScreen";
import MultisigDeploymentSuccessScreen from "./screens/MultisigDeploymentSuccessScreen";
import MultisigTransactionSuccessScreen from "./screens/MultisigTransactionSuccessScreen";
import RecoveryContractScreen from "./screens/RecoveryContractScreen";
import { RecoveryContractProvider } from "./providers/RecoveryContractProvider";
import RecoveryContractDeploymentSuccessScreen from "./screens/RecoveryContractDeploymentSuccessScreen";
import RecoveryContractActionSuccessScreen from "./screens/RecoveryContractActionSuccessScreen";

const App = () => {
  const {
    wallet,
    isLoading,
    isPasswordSet,
    generateWallet,
    importWallet,
    unlockWallet,
    lockWallet,
  } = useWallet();
  const [currentScreen, setCurrentScreen] = useState<Screen>("setup");
  const [generatedWalletData, setGeneratedWalletData] = useState<{
    privateKey: string;
    address: string;
  } | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>("");
  const [currentContractAddress, setCurrentContractAddress] =
    useState<string>("");
  const [transactionSuccess, setTransactionSuccess] = useState<{
    txHash: string;
    receipt: any;
    from: string;
    to: string;
    amount: string;
    gasPrice: string;
    gasLimit: number;
    chainId: number;
    timestamp: number;
  } | null>(null);
  const [multisigDeploymentSuccess, setMultisigDeploymentSuccess] = useState<{
    contractAddress: string;
    signers: string[];
    minSignatures: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  } | null>(null);
  const [multisigTransactionSuccess, setMultisigTransactionSuccess] = useState<{
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
  } | null>(null);
  const [recoveryContractDeploymentSuccess, setRecoveryContractDeploymentSuccess] = useState<{
    contractAddress: string;
    recoveryAddresses: string[];
    quorum: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  } | null>(null);
  const [recoveryContractActionSuccess, setRecoveryContractActionSuccess] = useState<{
    actionType: "deploy" | "addRecoveryAddress" | "removeRecoveryAddress" | "setQuorum" | "recover" | "tokenApproval";
    txHash: string;
    contractAddress: string;
    actionDetails: {
      address?: string;
      quorum?: number;
      recoverTo?: string;
      tokens?: string[];
    };
    signerAddress: string;
    chainId: number;
    timestamp: number;
  } | null>(null);

  // Set initial screen based on wallet state; do not overwrite 'generated' screen
  useEffect(() => {
    if (!isLoading) {
      if (wallet && currentScreen !== "generated") {
        setCurrentScreen("wallet");
      } else if (!wallet && isPasswordSet) {
        setCurrentScreen("unlock");
      } else if (!wallet && !isPasswordSet) {
        setCurrentScreen("setup");
      }
    }
  }, [isLoading, wallet, isPasswordSet, currentScreen]);

  const handleGenerateWallet = async (password: string) => {
    try {
      const { privateKey, address } = await generateWallet(password);
      setGeneratedWalletData({ privateKey, address });
      setCurrentScreen("generated");
    } catch (error) {
      console.error("Error generating wallet:", error);
      alert("Error generating wallet: " + (error as Error).message);
    }
  };

  const handleImportWallet = async (privateKey: string, password: string) => {
    try {
      await importWallet(privateKey, password);
      setCurrentScreen("wallet");
    } catch (error) {
      console.error("Error importing wallet:", error);
      alert("Error importing wallet: " + (error as Error).message);
    }
  };

  const handlePasswordSet = async (password: string) => {
    try {
      await handleGenerateWallet(password);
    } catch (error) {
      console.error("Error setting password:", error);
      setCurrentScreen("setup");
    }
  };

  const handleUnlock = async (password: string) => {
    const success = await unlockWallet(password);
    if (success) {
      setCurrentScreen("wallet");
    } else {
      alert("Invalid password. Please try again.");
    }
  };

  const handleLock = async () => {
    await lockWallet();
    setCurrentScreen("unlock");
  };

  const handleTransactionSuccess = (txData: {
    txHash: string;
    receipt: any;
    from: string;
    to: string;
    amount: string;
    gasPrice: string;
    gasLimit: number;
    chainId: number;
    timestamp: number;
  }) => {
    setTransactionSuccess(txData);
    setCurrentScreen("transaction-success");
  };

  const handleCloseTransactionSuccess = () => {
    setTransactionSuccess(null);
    setCurrentScreen("wallet");
  };

  const handleMultisigDeploymentSuccess = (deploymentData: {
    contractAddress: string;
    signers: string[];
    minSignatures: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  }) => {
    setMultisigDeploymentSuccess(deploymentData);
    setCurrentScreen("multisig-deployment-success");
  };

  const handleCloseMultisigDeploymentSuccess = () => {
    setMultisigDeploymentSuccess(null);
    setCurrentScreen("multisig");
  };

  const handleMultisigTransactionSuccess = (transactionData: {
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
  }) => {
    setMultisigTransactionSuccess(transactionData);
    setCurrentScreen("multisig-transaction-success");
  };

  const handleCloseMultisigTransactionSuccess = () => {
    setMultisigTransactionSuccess(null);
    setCurrentScreen("multisig-interact");
  };

  const handleRecoveryContractDeploymentSuccess = (deploymentData: {
    contractAddress: string;
    recoveryAddresses: string[];
    quorum: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  }) => {
    setRecoveryContractDeploymentSuccess(deploymentData);
    setCurrentScreen("recovery-contract-deployment-success");
  };

  const handleCloseRecoveryContractDeploymentSuccess = () => {
    setRecoveryContractDeploymentSuccess(null);
    setCurrentScreen("recovery-contract");
  };

  const handleRecoveryContractActionSuccess = (actionData: {
    actionType: "deploy" | "addRecoveryAddress" | "removeRecoveryAddress" | "setQuorum" | "recover" | "tokenApproval";
    txHash: string;
    contractAddress: string;
    actionDetails: {
      address?: string;
      quorum?: number;
      recoverTo?: string;
      tokens?: string[];
    };
    signerAddress: string;
    chainId: number;
    timestamp: number;
  }) => {
    setRecoveryContractActionSuccess(actionData);
    setCurrentScreen("recovery-contract-action-success");
  };

  const handleCloseRecoveryContractActionSuccess = () => {
    setRecoveryContractActionSuccess(null);
    setCurrentScreen("recovery-contract");
  };

  const handleOpenMultisigInteract = (addr: string) => {
    setCurrentContractAddress(addr);
    setCurrentScreen("multisig-interact");
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If wallet is loaded, show wallet screens
  if (wallet) {
    let component: JSX.Element;
    switch (currentScreen) {
      case "wallet":
        component = (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      case "send":
        component = (
          <SendScreen
            onBack={() => setCurrentScreen("wallet")}
            onTransactionSuccess={handleTransactionSuccess}
          />
        );
        break;
      case "send-erc20":
        component = (
          <SendErc20Screen
            onBack={() => setCurrentScreen("wallet")}
            onTransactionSuccess={handleTransactionSuccess}
          />
        );
        break;
      case "transaction-success":
        component = transactionSuccess ? (
          <TransactionSuccessScreen
            txHash={transactionSuccess.txHash}
            receipt={transactionSuccess.receipt}
            from={transactionSuccess.from}
            to={transactionSuccess.to}
            amount={transactionSuccess.amount}
            gasPrice={transactionSuccess.gasPrice}
            gasLimit={transactionSuccess.gasLimit}
            chainId={transactionSuccess.chainId}
            timestamp={transactionSuccess.timestamp}
            onClose={handleCloseTransactionSuccess}
          />
        ) : (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      case "view-private-key":
        component = (
          <ViewPrivateKeyScreen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      case "sign-out":
        component = <SignOutScreen onBack={() => setCurrentScreen("wallet")} />;
        break;
      case "multisig":
        component = (
          <MultisigScreen
            onBack={() => setCurrentScreen("wallet")}
            onOpenMultisigInteract={handleOpenMultisigInteract}
            onMultisigDeploymentSuccess={handleMultisigDeploymentSuccess}
          />
        );
        break;
      case "multisig-interact":
        component = (
          <MultisigContractProvider contractAddress={currentContractAddress}>
            <MultisigInteractScreen
              onBack={() => setCurrentScreen("wallet")}
              contractAddress={currentContractAddress}
              onMultisigTransactionSuccess={handleMultisigTransactionSuccess}
            />
          </MultisigContractProvider>
        );
        break;
      case "tokens":
        component = <TokenScreen onBack={() => setCurrentScreen("wallet")} />;
        break;
      case "address-book":
        component = (
          <AddressBookScreen onBack={() => setCurrentScreen("wallet")} />
        );
        break;
      case "multisig-deployment-success":
        component = multisigDeploymentSuccess ? (
          <MultisigDeploymentSuccessScreen
            contractAddress={multisigDeploymentSuccess.contractAddress}
            signers={multisigDeploymentSuccess.signers}
            minSignatures={multisigDeploymentSuccess.minSignatures}
            deployerAddress={multisigDeploymentSuccess.deployerAddress}
            chainId={multisigDeploymentSuccess.chainId}
            timestamp={multisigDeploymentSuccess.timestamp}
            onClose={handleCloseMultisigDeploymentSuccess}
            onOpenMultisigInteract={handleOpenMultisigInteract}
          />
        ) : (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      case "multisig-transaction-success":
        component = multisigTransactionSuccess ? (
          <MultisigTransactionSuccessScreen
            transactionType={multisigTransactionSuccess.transactionType}
            txHash={multisigTransactionSuccess.txHash}
            contractAddress={multisigTransactionSuccess.contractAddress}
            transactionId={multisigTransactionSuccess.transactionId}
            recipientAddress={multisigTransactionSuccess.recipientAddress}
            amount={multisigTransactionSuccess.amount}
            tokenAddress={multisigTransactionSuccess.tokenAddress}
            signerAddress={multisigTransactionSuccess.signerAddress}
            chainId={multisigTransactionSuccess.chainId}
            timestamp={multisigTransactionSuccess.timestamp}
            onClose={handleCloseMultisigTransactionSuccess}
          />
        ) : (
          <MultisigInteractScreen
            onBack={() => setCurrentScreen("wallet")}
            contractAddress={currentContractAddress}
            onMultisigTransactionSuccess={handleMultisigTransactionSuccess}
          />
        );
        break;
      case "recovery-contract":
        component = (
          <RecoveryContractProvider contractAddress={currentContractAddress}>
            <RecoveryContractScreen
              setProviderContractAddress={setCurrentContractAddress}
              onRecoveryContractDeploymentSuccess={handleRecoveryContractDeploymentSuccess}
              onRecoveryContractActionSuccess={handleRecoveryContractActionSuccess}
            />
          </RecoveryContractProvider>
        );
        break;
      case "recovery-contract-deployment-success":
        component = recoveryContractDeploymentSuccess ? (
          <RecoveryContractDeploymentSuccessScreen
            contractAddress={recoveryContractDeploymentSuccess.contractAddress}
            recoveryAddresses={recoveryContractDeploymentSuccess.recoveryAddresses}
            quorum={recoveryContractDeploymentSuccess.quorum}
            deployerAddress={recoveryContractDeploymentSuccess.deployerAddress}
            chainId={recoveryContractDeploymentSuccess.chainId}
            timestamp={recoveryContractDeploymentSuccess.timestamp}
            onClose={handleCloseRecoveryContractDeploymentSuccess}
          />
        ) : (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      case "recovery-contract-action-success":
        component = recoveryContractActionSuccess ? (
          <RecoveryContractActionSuccessScreen
            actionType={recoveryContractActionSuccess.actionType}
            txHash={recoveryContractActionSuccess.txHash}
            contractAddress={recoveryContractActionSuccess.contractAddress}
            actionDetails={recoveryContractActionSuccess.actionDetails}
            signerAddress={recoveryContractActionSuccess.signerAddress}
            chainId={recoveryContractActionSuccess.chainId}
            timestamp={recoveryContractActionSuccess.timestamp}
            onClose={handleCloseRecoveryContractActionSuccess}
          />
        ) : (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
      default:
        component = (
          <WalletScreen
            onSendEth={() => setCurrentScreen("send")}
            onSendErc20={() => setCurrentScreen("send-erc20")}
            onUploadMultisig={() => setCurrentScreen("multisig")}
            onViewTokens={() => setCurrentScreen("tokens")}
            onViewAddressBook={() => setCurrentScreen("address-book")}
          />
        );
        break;
    }

    return (
      <>
        <Navbar
          onLock={handleLock}
          onViewPrivateKey={() => setCurrentScreen("view-private-key")}
          onSignOut={() => setCurrentScreen("sign-out")}
          onRecoveryContract={() => setCurrentScreen("recovery-contract")}
          dark
          showMenu
          setCurrentScreen={setCurrentScreen}
        />
        {component}
      </>
    );
  }

  // If password is set but no wallet is loaded, show unlock screen
  if (isPasswordSet && !wallet) {
    return (
      <>
        <Navbar dark showMenu={false} setCurrentScreen={setCurrentScreen} />
        <PasswordUnlockScreen onUnlock={handleUnlock} />
      </>
    );
  }

  // If no password is set, show setup screen
  if (!isPasswordSet) {
    let component: JSX.Element;
    switch (currentScreen) {
      case "setup":
        component = (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen("password-setup")}
            onImportWallet={() => setCurrentScreen("import")}
          />
        );
        break;
      case "password-setup":
        component = (
          <PasswordSetupScreen
            onPasswordSet={handlePasswordSet}
            onBack={() => setCurrentScreen("setup")}
          />
        );
        break;
      case "import":
        component = (
          <ImportScreen
            onBack={() => setCurrentScreen("setup")}
            onImport={(privateKey, password) =>
              handleImportWallet(privateKey, password)
            }
          />
        );
        break;
      case "generated":
        component = (
          <GeneratedWalletScreen
            walletData={generatedWalletData}
            onContinue={() => setCurrentScreen("wallet")}
          />
        );
        break;
      default:
        component = (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen("password-setup")}
            onImportWallet={() => setCurrentScreen("import")}
          />
        );
        break;
    }

    return (
      <>
        <Navbar dark showMenu={false} setCurrentScreen={setCurrentScreen} />
        {component}
      </>
    );
  }

  // Default fallback
  return (
    <SetupScreen
      onGenerateWallet={() => setCurrentScreen("password-setup")}
      onImportWallet={() => setCurrentScreen("import")}
    />
  );
};

export default App;
