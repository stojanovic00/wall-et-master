// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "forge-std/Test.sol";
import "../src/contracts/MultiSig.sol";
import "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";

contract MultiSigTest is Test {
    MultiSig public multiSig;
    ERC20Mock public erc20;

    address[] public signers;
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public dave = address(0x4);
    address public eve = address(0x5);
    address nonSigner = address(0x999);

    uint256 public minSignatures = 3;

    function setUp() public {
        signers = [alice, bob, charlie, dave, eve];
        multiSig = new MultiSig(signers, minSignatures);
        erc20 = new ERC20Mock();
        // Fund the contract with some ETH
        vm.deal(address(multiSig), 10 ether);
        // Mint ERC20 tokens to Alice for testing
        erc20.mint(alice, 1000 ether);
    }

    function testSetup() public view {
        assertEq(multiSig.minSignatures(), 3);
        assertTrue(multiSig.isSigner(alice));
        assertTrue(multiSig.isSigner(bob));
        assertTrue(multiSig.isSigner(charlie));
        assertTrue(multiSig.isSigner(dave));
        assertTrue(multiSig.isSigner(eve));
    }

    function testAliceProposesTransactionToBob() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        IMultiSig.Transaction memory txData = multiSig.getTransaction(txHash);
        assertEq(txData.to, bob);
        assertEq(txData.amount, 3 ether);
        assertEq(txData.proposer, alice);
        assertEq(txData.signedCount, 0);
        assertFalse(txData.executed);
        assertEq(txData.balance, 0);
        assertTrue(txData.native);
        assertEq(txData.token, address(0));
    }

    function test_RevertWhen_ExecuteNonExistentTransaction() public {
        bytes32 fakeTxHash = keccak256(abi.encodePacked("fake transaction"));

        vm.prank(alice);
        vm.expectRevert("Transaction not found");
        multiSig.execute(fakeTxHash);
    }

    function test_RevertWhen_ExecuteWithoutEnoughSignatures() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        vm.prank(alice);
        vm.expectRevert("Not enough signatures");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ExecuteWithoutEnoughFunds() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        vm.prank(alice);
        vm.expectRevert("Not enough balance");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ExecuteByNonSigner() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        multiSig.depositNative{value: 3 ether}(txHash);

        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        vm.prank(nonSigner);
        vm.expectRevert("Only signers can call this function");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_ProposeToZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert("Invalid target address");
        multiSig.proposeNative(address(0), 3 ether);
    }

    function test_RevertWhen_ProposeWithZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert("Amount must be greater than 0");
        multiSig.proposeNative(bob, 0);
    }

    function test_RevertWhen_SignByNonSigner() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        vm.prank(nonSigner);
        vm.expectRevert("Only signers can call this function");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_SignAlreadySigned() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        vm.prank(alice);
        multiSig.sign(txHash);

        vm.prank(alice);
        vm.expectRevert("Already signed");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_SignExecutedTransaction() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        multiSig.depositNative{value: 3 ether}(txHash);
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        vm.prank(alice);
        multiSig.execute(txHash);

        vm.prank(dave);
        vm.expectRevert("Transaction already executed");
        multiSig.sign(txHash);
    }

    function test_RevertWhen_ExecuteAlreadyExecuted() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        multiSig.depositNative{value: 3 ether}(txHash);
        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        vm.prank(alice);
        multiSig.execute(txHash);

        vm.prank(alice);
        vm.expectRevert("Transaction already executed");
        multiSig.execute(txHash);
    }

    function test_RevertWhen_DepositToNonExistentTransaction() public {
        bytes32 fakeTxHash = keccak256(abi.encodePacked("fake transaction"));
        vm.expectRevert("Transaction not found");
        multiSig.depositNative{value: 1 ether}(fakeTxHash);
    }

    function test_RevertWhen_DepositNativeToTokenTransaction() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeToken(bob, 100 ether, address(erc20));

        vm.expectRevert("Transaction is not native");
        multiSig.depositNative{value: 1 ether}(txHash);
    }

    function test_RevertWhen_DepositTokenToNativeTransaction() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        vm.prank(alice);
        erc20.approve(address(multiSig), 100 ether);
        vm.expectRevert("Transaction is not a token transaction");
        multiSig.depositToken(txHash, 100 ether);
    }

    function test_SuccessfulExecution() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 3 ether);

        multiSig.depositNative{value: 3 ether}(txHash);

        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        uint256 bobBalanceBefore = bob.balance;
        vm.prank(alice);
        multiSig.execute(txHash);

        IMultiSig.Transaction memory txData = multiSig.getTransaction(txHash);
        assertTrue(txData.executed);
        assertEq(bob.balance, bobBalanceBefore + 3 ether);
    }

    function test_GetContractBalanceNative() public view {
        assertEq(multiSig.getContractBalanceNative(), 10 ether);
    }

    function test_ConstructorValidation() public {
        address[] memory emptySigners = new address[](0);
        vm.expectRevert("Must have at least one signer");
        new MultiSig(emptySigners, 1);

        address[] memory validSigners = new address[](2);
        validSigners[0] = alice;
        validSigners[1] = bob;

        vm.expectRevert("Min signatures must be greater than 0");
        new MultiSig(validSigners, 0);

        vm.expectRevert("Min signatures cannot exceed signer count");
        new MultiSig(validSigners, 3);
    }

    function test_RevertWhen_ConstructorDuplicateSigner() public {
        address[] memory dupSigners = new address[](3);
        dupSigners[0] = alice;
        dupSigners[1] = alice;
        dupSigners[2] = bob;

        vm.expectRevert("Duplicate signer");
        new MultiSig(dupSigners, 2);
    }

    function test_RevertWhen_ConstructorZeroAddressSigner() public {
        address[] memory invalidSigners = new address[](2);
        invalidSigners[0] = alice;
        invalidSigners[1] = address(0);

        vm.expectRevert("Invalid signer address");
        new MultiSig(invalidSigners, 1);
    }

    function test_SignatureCounting() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 1 ether);

        assertEq(multiSig.getTransaction(txHash).signedCount, 0);

        vm.prank(alice);
        multiSig.sign(txHash);
        assertEq(multiSig.getTransaction(txHash).signedCount, 1);

        vm.prank(bob);
        multiSig.sign(txHash);
        assertEq(multiSig.getTransaction(txHash).signedCount, 2);

        vm.prank(charlie);
        multiSig.sign(txHash);
        assertEq(multiSig.getTransaction(txHash).signedCount, 3);
    }

    function test_HasSignedTxMapping() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 1 ether);

        assertFalse(multiSig.hasSignedTx(alice, txHash));

        vm.prank(alice);
        multiSig.sign(txHash);
        assertTrue(multiSig.hasSignedTx(alice, txHash));
        assertFalse(multiSig.hasSignedTx(bob, txHash));
    }

    function testERC20_ProposeDepositSignExecute() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeToken(bob, 100 ether, address(erc20));

        vm.prank(alice);
        erc20.approve(address(multiSig), 100 ether);
        vm.prank(alice);
        multiSig.depositToken(txHash, 100 ether);

        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        uint256 bobBalanceBefore = erc20.balanceOf(bob);
        vm.prank(alice);
        multiSig.execute(txHash);

        IMultiSig.Transaction memory txData = multiSig.getTransaction(txHash);
        assertTrue(txData.executed);
        assertEq(erc20.balanceOf(bob), bobBalanceBefore + 100 ether);
    }

    function testERC20_RevertWhen_InsufficientTokenBalance() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeToken(bob, 100 ether, address(erc20));

        vm.prank(alice);
        erc20.approve(address(multiSig), 50 ether);
        vm.prank(alice);
        multiSig.depositToken(txHash, 50 ether);

        vm.prank(alice);
        multiSig.sign(txHash);
        vm.prank(bob);
        multiSig.sign(txHash);
        vm.prank(charlie);
        multiSig.sign(txHash);

        vm.prank(alice);
        vm.expectRevert("Not enough balance");
        multiSig.execute(txHash);
    }

    function testERC20_RevertWhen_ProposeToZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert("Invalid target address");
        multiSig.proposeToken(address(0), 100 ether, address(erc20));
    }

    function testERC20_RevertWhen_ProposeWithZeroToken() public {
        vm.prank(alice);
        vm.expectRevert("Invalid token address");
        multiSig.proposeToken(bob, 100 ether, address(0));
    }

    function testERC20_RevertWhen_ProposeWithZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert("Amount must be greater than 0");
        multiSig.proposeToken(bob, 0, address(erc20));
    }

    function testGetTransactionBalance_ETH() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeNative(bob, 1 ether);
        multiSig.depositNative{value: 1 ether}(txHash);
        assertEq(multiSig.getTransactionBalance(txHash), 1 ether);
    }

    function testGetTransactionBalance_NonExistent() public view {
        bytes32 fakeTxHash = keccak256(abi.encodePacked("fake"));
        assertEq(multiSig.getTransactionBalance(fakeTxHash), 0);
    }

    function testGetTransactionBalance_ERC20() public {
        vm.prank(alice);
        bytes32 txHash = multiSig.proposeToken(bob, 100 ether, address(erc20));
        vm.prank(alice);
        erc20.approve(address(multiSig), 100 ether);
        vm.prank(alice);
        multiSig.depositToken(txHash, 100 ether);
        assertEq(multiSig.getTransactionBalance(txHash), 100 ether);
    }

    function testGetContractBalanceToken() public {
        assertEq(multiSig.getContractBalanceToken(address(erc20)), 0);

        vm.prank(alice);
        bytes32 txHash = multiSig.proposeToken(bob, 50 ether, address(erc20));
        vm.prank(alice);
        erc20.approve(address(multiSig), 50 ether);
        vm.prank(alice);
        multiSig.depositToken(txHash, 50 ether);
        assertEq(multiSig.getContractBalanceToken(address(erc20)), 50 ether);
    }
}
