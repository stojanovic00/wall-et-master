import { ethers } from "ethers";
import ApproverJson from "../../contracts/Approver.json";
import Erc20Json from "../../contracts/ERC20.json";

export async function revokeDelegation(signer: ethers.Wallet) {
  console.log("\n=== REVOKING DELEGATION ===");

  const currentNonce = await signer.getNonce();
  console.log("Current nonce for revocation:", currentNonce);

  // Create authorization to revoke (set address to zero address)
  const revokeAuth = await signer.authorize({
    address: ethers.ZeroAddress, // Zero address to revoke
    nonce: currentNonce + 1,
  });

  console.log("Revocation authorization created");

  // Send transaction with revocation authorization
  const tx = await signer.sendTransaction({
    type: 4,
    to: signer.address,
    authorizationList: [revokeAuth],
  });

  console.log("Revocation transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Delegation revoked successfully!");

  return receipt;
}

export async function setupDelegation(signer: ethers.Wallet, targetAddress: string) {
  console.log("\n=== SETTING UP DELEGATION ===");
  const currentNonce = await signer.getNonce();
  const auth = await signer.authorize({
    address: targetAddress,
    nonce: currentNonce,
  });
  const tx = await signer.sendTransaction({
    type: 4,
    to: signer.address,
    authorizationList: [auth],
  });
  console.log("Setup delegation tx:", tx.hash);
  await tx.wait();
  console.log("Delegation active");
  return tx.hash;
}

export async function depositTokenWithDelegation(
  signer: ethers.Wallet,
  tokenAddress: string,
  multiSigContract: string,
  txHash: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== DEPOSIT WITH ACTIVE DELEGATION ===");
  const delegatedContract = new ethers.Contract(
    signer.address,
    ApproverJson.abi,
    signer
  );
  const tx = await delegatedContract["approveAndDeposit(address,address,bytes32,uint256)"](
    tokenAddress,
    multiSigContract,
    txHash,
    amount,
    { type: 2 }
  );
  console.log("Deposit tx:", tx.hash);
  return await tx.wait();
}

export async function depositTokenClassic(
  signer: ethers.Wallet,
  tokenAddress: string,
  multiSigContract: string,
  txHash: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== CLASSIC DEPOSIT (2 TX) ===");
  const tokenContract = new ethers.Contract(tokenAddress, Erc20Json.abi, signer);

  console.log("Step 1: approve");
  const approveTx = await tokenContract["approve(address,uint256)"](multiSigContract, amount);
  await approveTx.wait();
  console.log("Approve confirmed");

  console.log("Step 2: deposit");
  const multisig = new ethers.Contract(
    multiSigContract,
    [
      "function deposit(address token, bytes32 txHash, uint256 amount) external",
    ],
    signer
  );
  const depositTx = await multisig["deposit(address,bytes32,uint256)"](tokenAddress, txHash, amount);
  await depositTx.wait();
  console.log("Deposit confirmed");
  return depositTx.hash;
}

export async function createAuthorization(signer: ethers.Wallet, targetAddress: string, nonce: number) {
  const auth = await signer.authorize({
    address: targetAddress,
    nonce: nonce,
  });

  console.log("Authorization created with nonce:", auth.nonce);
  return auth;
}

export async function createDelegation(
  signer: ethers.Wallet, 
  targetAddress: string, 
  tokenAddress: string, 
  multiSigContract: string, 
  approvalTxHash: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== CREATING DELEGATION ===");
  const currentNonce = await signer.getNonce();
  console.log("Current nonce for signer:", currentNonce);

  // Create authorization with incremented nonce for same-wallet transactions
  const auth = await createAuthorization(signer, targetAddress, currentNonce + 1);

  // Create contract instance and execute
  const delegatedContract = new ethers.Contract(
    signer.address,
    ApproverJson.abi,
    signer
  );

  const tx = await delegatedContract["approveAndDeposit(address,address,bytes32,uint256)"](
    tokenAddress,
    multiSigContract,
    approvalTxHash,
    amount,
    {
      type: 4,
      authorizationList: [auth],
    }
  );

  console.log("Transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Receipt transaction:", receipt);

  return receipt;
}
