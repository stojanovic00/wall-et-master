// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {RSDC} from "../src/contracts/RSDC.sol";

/// @notice Deploys the RSDC test ERC20 token and mints an initial supply
/// to the deployer, for testing WALL-ET's ERC20 transfer and multisig
/// deposit flows on Sepolia.
contract DeployRSDC is Script {
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18; // 1,000,000 RSDC (18 decimals)

    function run() external returns (RSDC token) {
        vm.startBroadcast();
        token = new RSDC();
        token.mint(msg.sender, INITIAL_SUPPLY);
        vm.stopBroadcast();

        console2.log("RSDC deployed to:", address(token));
        console2.log("Minted to deployer:", msg.sender);
    }
}
