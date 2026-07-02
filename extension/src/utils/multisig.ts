import { ethers } from "ethers";
import ApproverJson from "../../contracts/Approver.json";

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
