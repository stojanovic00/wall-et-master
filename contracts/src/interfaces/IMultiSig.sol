// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

/**
 * @title IMultiSig
 * @dev Interface for the MultiSig contract
 */
interface IMultiSig {
    struct Transaction {
        address to;
        bool native;
        address token;
        uint256 amount;
        address proposer;
        uint256 timestamp;
        uint256 signedCount;
        bool executed;
        uint256 balance;
    }

    // State-changing functions
    function depositNative(bytes32 txHash) external payable;

    function depositToken(bytes32 txHash, uint256 amount) external;

    function proposeNative(address to, uint256 amount) external returns (bytes32 txHash);

    function proposeToken(address to, uint256 amount, address token) external returns (bytes32 txHash);

    function sign(bytes32 txHash) external;

    function execute(bytes32 txHash) external;

    // View functions
    function minSignatures() external view returns (uint256);

    function isSigner(address signer) external view returns (bool);

    function hasSignedTx(address signer, bytes32 txHash) external view returns (bool);

    function getTransaction(bytes32 txHash) external view returns (Transaction memory);

    function getContractBalanceNative() external view returns (uint256);

    function getTransactionBalance(bytes32 txHash) external view returns (uint256);

    function getContractBalanceToken(address token) external view returns (uint256);
}
