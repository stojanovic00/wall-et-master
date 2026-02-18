// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/contracts/Approver.sol";
import "../src/contracts/MultiSig.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(address initialHolder) ERC20("Mock Token", "MTK") {
        _mint(initialHolder, 10);
    }
}

contract ApproverTest is Test {
    Approver public approver;
    MultiSig public multiSig;
    MockERC20 public token;

    address public signer1 = address(0x123);
    address public signer2 = address(0x456);

    function setUp() public {
        approver = new Approver();
        token = new MockERC20(signer1);

        address[] memory signers = new address[](2);
        signers[0] = signer1;
        signers[1] = signer2;
        multiSig = new MultiSig(signers, 1);
    }

    function testSetup() public view {
        assertEq(token.balanceOf(signer1), 10);
    }

    function testApproveAndDeposit() public {
        // This mimics the EIP-7702 delegation flow we consider approver addr to be same as signer1
        vm.startPrank(signer1);
        token.approve(address(approver), 10);
        token.transfer(address(approver), 10);
        vm.stopPrank();

        //add here check that approver has balance of 10 tokens
        assertEq(token.balanceOf(address(approver)), 10);

        // we need to propose something to get txhash
        vm.startPrank(signer1);
        bytes32 txHash = multiSig.proposeToken(address(0x999), 10, address(token));
        vm.stopPrank();

        //now we test a
        approver.approveAndDeposit(
            address(token),
            address(multiSig),
            txHash,
            3
        );

        //add here check that approver has balance of 7 tokens which will mean assigner has spent 3 tokens
        assertEq(token.balanceOf(address(approver)), 7);

        //add here check that multiSig has balance of 3 tokens
        assertEq(token.balanceOf(address(multiSig)), 3);
    }
}
