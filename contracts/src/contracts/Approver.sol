// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IMultiSig.sol";

/**
 * @title Approver
 * @dev Contract that holds ERC-20 tokens and approves spenders to use them
 * Can be delegated to by EOAs using EIP-7702
 */
contract Approver {
    /**
     * @dev Approve ERC-20 tokens for a spender
     * @param token The ERC-20 token address
     * @param spender The address that will spend the tokens
     * @param amount The amount of tokens to approve
     */
    function approveToken(
        address token,
        address spender,
        uint256 amount
    ) public returns (bool) {
        require(token != address(0), "Invalid token address");
        require(spender != address(0), "Invalid spender address");

        // Execute the ERC-20 approval from THIS contract
        bool success = IERC20(token).approve(spender, amount);
        require(success, "ERC-20 approval failed");

        return true;
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Deposit ERC-20 tokens to MultiSig contract
     * @param multiSigAddress The address of the MultiSig contract
     * @param txHash The transaction hash for the deposit
     * @param amount The amount of tokens to deposit
     */
    function depositTokenToMultiSig(
        address multiSigAddress,
        bytes32 txHash,
        uint256 amount
    ) public {
        require(multiSigAddress != address(0), "Invalid MultiSig address");
        require(amount > 0, "Amount must be greater than 0");

        IMultiSig(multiSigAddress).depositToken(txHash, amount);
    }

    /**
     * @dev Combined function for EIP-7702: Approve tokens and deposit to MultiSig
     * @param token The ERC-20 token address to approve
     * @param multiSigAddress The address of the MultiSig contract
     * @param txHash The transaction hash for the deposit
     * @param depositAmount The amount of tokens to deposit to MultiSig
     */
    function approveAndDeposit(
        address token,
        address multiSigAddress,
        bytes32 txHash,
        uint256 depositAmount
    ) external {
        this.approveToken(token, multiSigAddress, depositAmount);
        this.depositTokenToMultiSig(multiSigAddress, txHash, depositAmount);
    }

    /**
     * @dev Get the contract's token balance
     * @param token The ERC-20 token address
     * @return The contract's token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get the allowance for a spender
     * @param token The ERC-20 token address
     * @param spender The spender address
     * @return The allowance amount
     */
    function getAllowance(
        address token,
        address spender
    ) external view returns (uint256) {
        return IERC20(token).allowance(address(this), spender);
    }

    function approveRecovery(
        address[] memory tokens,
        address spender
    ) external {
        require(spender != address(0), "Invalid spender address");
        require(spender.code.length > 0, "Spender is not a contract");

        for (uint256 i = 0; i < tokens.length; i++) {
            this.approveToken(tokens[i], spender, type(uint256).max);
        }

        (bool success, ) = spender.call(
            abi.encodeWithSignature("addTokens(address[])", tokens)
        );
        require(success, "Failed to add tokens to social recovery");
    }
}
