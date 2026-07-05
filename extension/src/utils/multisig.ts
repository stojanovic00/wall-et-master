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
  // Explicit gasLimit: some RPC providers underestimate gas for type-4 txs,
  // not accounting for the extra intrinsic cost EIP-7702 charges per
  // authorization tuple, which causes an IntrinsicGas rejection at the
  // default ~21000 estimate.
  const tx = await signer.sendTransaction({
    type: 4,
    to: signer.address,
    authorizationList: [revokeAuth],
    gasLimit: 100000,
  });

  console.log("Revocation transaction sent:", tx.hash);

  const receipt = await tx.wait();
  console.log("Delegation revoked successfully!");

  return receipt;
}

export async function setupDelegation(signer: ethers.Wallet, targetAddress: string) {
  console.log("\n=== SETTING UP DELEGATION ===");
  const currentNonce = await signer.getNonce();
  // The transaction below is self-sponsored (signer authorizes and sends the
  // tx itself), so by the time the protocol checks the authorization's nonce
  // against on-chain state, the tx's own nonce consumption has already
  // incremented it once - matches the +1 revokeDelegation already uses below.
  const auth = await signer.authorize({
    address: targetAddress,
    nonce: currentNonce + 1,
  });
  // See revokeDelegation for why gasLimit is set explicitly here.
  const tx = await signer.sendTransaction({
    type: 4,
    to: signer.address,
    authorizationList: [auth],
    gasLimit: 100000,
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

export async function approveTokenClassic(
  signer: ethers.Wallet,
  tokenAddress: string,
  multiSigContract: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== CLASSIC APPROVE (1/2) ===");
  const tokenContract = new ethers.Contract(tokenAddress, Erc20Json.abi, signer);
  const approveTx = await tokenContract["approve(address,uint256)"](multiSigContract, amount);
  await approveTx.wait();
  console.log("Approve confirmed:", approveTx.hash);
  return approveTx.hash;
}

export async function depositTokenClassic(
  signer: ethers.Wallet,
  multiSigContract: string,
  txHash: string,
  amount: ethers.BigNumberish
) {
  console.log("\n=== CLASSIC DEPOSIT (2/2) ===");
  const multisig = new ethers.Contract(
    multiSigContract,
    [
      "function depositToken(bytes32 txHash, uint256 amount) external",
    ],
    signer
  );
  const depositTx = await multisig["depositToken(bytes32,uint256)"](txHash, amount);
  await depositTx.wait();
  console.log("Deposit confirmed");
  return depositTx.hash;
}
