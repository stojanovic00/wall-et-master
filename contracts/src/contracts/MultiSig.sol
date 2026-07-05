// SPDX-License-Identifier: MIT

pragma solidity >=0.8.2 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IMultiSig} from "../interfaces/IMultiSig.sol";

/**
 * @title MultiSig
 * @dev Multi-signature wallet contract
 */
contract MultiSig is IMultiSig {
    // Validator addresses
    mapping(address => bool) private signers;

    // Minimum number of signatures required for quorum
    uint256 public minSignatures;

    uint256 private nonce;

    // Keccak256(Transaction) => Transaction
    mapping(bytes32 => Transaction) private transactions;
    mapping(address => mapping(bytes32 => bool)) private transactionSigners;

    event Propose(bytes32 txHash);
    event Signed(bytes32 indexed txHash, address indexed signer);
    event Executed(bytes32 indexed txHash);

    modifier onlySigner() {
        require(signers[msg.sender], "Only signers can call this function");
        _;
    }

    /*
     * @dev Constructor - sets up validators and minimum signatures
     * @param _signers Array of validator addresses
     * @param _minSignatures Minimum number of signatures required for quorum
     */
    constructor(address[] memory _signers, uint256 _minSignatures) {
        require(_signers.length > 0, "Must have at least one signer");
        require(_minSignatures > 0, "Min signatures must be greater than 0");
        require(_minSignatures <= _signers.length, "Min signatures cannot exceed signer count");

        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer address");
            require(!signers[_signers[i]], "Duplicate signer");
            signers[_signers[i]] = true;
        }
        minSignatures = _minSignatures;
    }

    function depositNative(bytes32 txHash) external payable {
        require(transactions[txHash].proposer != address(0), "Transaction not found");
        require(transactions[txHash].native, "Transaction is not native");
        transactions[txHash].balance += msg.value;
    }

    function depositToken(bytes32 txHash, uint256 amount) external {
        require(transactions[txHash].proposer != address(0), "Transaction not found");
        require(!transactions[txHash].native, "Transaction is not a token transaction");

        IERC20 tokenContract = IERC20(transactions[txHash].token);
        tokenContract.transferFrom(msg.sender, address(this), amount);
        transactions[txHash].balance += amount;
    }

    function proposeNative(address to, uint256 amount) external returns (bytes32 txHash) {
        require(to != address(0), "Invalid target address");
        require(amount > 0, "Amount must be greater than 0");

        Transaction memory transaction = Transaction({
            to: to,
            amount: amount,
            native: true,
            token: address(0),
            proposer: msg.sender,
            timestamp: block.timestamp,
            signedCount: 0,
            executed: false,
            balance: 0
        });

        txHash = keccak256(abi.encodePacked(msg.sender, nonce++));

        transactions[txHash] = transaction;
        emit Propose(txHash);
        return txHash;
    }

    function proposeToken(address to, uint256 amount, address token) external returns (bytes32 txHash) {
        require(to != address(0), "Invalid target address");
        require(amount > 0, "Amount must be greater than 0");
        require(token != address(0), "Invalid token address");

        IERC20 tokenContract = IERC20(token);
        require(tokenContract.totalSupply() > 0, "Token not deployed");

        Transaction memory transaction = Transaction({
            to: to,
            native: false,
            token: token,
            amount: amount,
            proposer: msg.sender,
            timestamp: block.timestamp,
            signedCount: 0,
            executed: false,
            balance: 0
        });

        txHash = keccak256(abi.encodePacked(msg.sender, nonce++));

        transactions[txHash] = transaction;
        emit Propose(txHash);
        return txHash;
    }

    function sign(bytes32 txHash) external onlySigner {
        Transaction storage transaction = transactions[txHash];

        require(transaction.proposer != address(0), "Transaction not found");
        require(!transaction.executed, "Transaction already executed");
        require(!transactionSigners[msg.sender][txHash], "Already signed");

        transactionSigners[msg.sender][txHash] = true;
        transaction.signedCount++;

        emit Signed(txHash, msg.sender);
    }

    function execute(bytes32 txHash) external onlySigner {
        Transaction storage transaction = transactions[txHash];
        require(transaction.proposer != address(0), "Transaction not found");
        require(transaction.signedCount >= minSignatures, "Not enough signatures");
        require(!transaction.executed, "Transaction already executed");

        if (transaction.native) {
            require(transaction.balance >= transaction.amount, "Not enough balance");
            require(address(this).balance >= transaction.amount, "Insufficient contract balance");

            transaction.executed = true;
            (bool success,) = transaction.to.call{value: transaction.amount}("");

            require(success, "Execution failed");
        } else {
            require(transaction.balance >= transaction.amount, "Not enough balance");

            IERC20 tokenContract = IERC20(transaction.token);
            require(tokenContract.balanceOf(address(this)) >= transaction.amount, "Insufficient contract token balance");

            transaction.executed = true;
            bool success = tokenContract.transfer(transaction.to, transaction.amount);

            require(success, "Execution failed");
        }

        emit Executed(txHash);
    }

    function isSigner(address signer) public view returns (bool) {
        return signers[signer];
    }

    function hasSignedTx(address signer, bytes32 txHash) public view returns (bool) {
        return transactionSigners[signer][txHash];
    }

    function getTransaction(bytes32 txHash) external view returns (Transaction memory) {
        return transactions[txHash];
    }

    function getContractBalanceNative() public view returns (uint256) {
        return address(this).balance;
    }

    function getTransactionBalance(bytes32 txHash) public view returns (uint256) {
        return transactions[txHash].balance;
    }

    function getContractBalanceToken(address token) public view returns (uint256) {
        IERC20 tokenContract = IERC20(token);
        return tokenContract.balanceOf(address(this));
    }
}
