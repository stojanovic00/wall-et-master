// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {Approver} from "../src/contracts/Approver.sol";

/// @notice Deploys the Approver contract used as the EIP-7702 delegation
/// target for WALL-ET wallets.
contract DeployApprover is Script {
    function run() external returns (Approver approver) {
        vm.startBroadcast();
        approver = new Approver();
        vm.stopBroadcast();

        console2.log("Approver deployed to:", address(approver));
    }
}
