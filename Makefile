-include contracts/.env

PHONY: build-contracts
build-contracts:
	cd contracts && forge build
	cd ..

PHONY: build-extension
build-extension:
	cd extension && npm run build 
	cd ..

PHONY: dev
dev:
	cd extension && npm run dev
	cd ..

PHONY: build
build: 
	make build-contracts
	for i in contracts/src/contracts/*.sol; do \
		name=$$(basename $$i .sol); \
		echo $$name; \
		cp contracts/out/$$name.sol/$$name.json extension/contracts/$$name.json; \
	done
	make build-extension

PHONY: deploy-approver
deploy-approver:
	@cd contracts && forge script script/DeployApprover.s.sol:DeployApprover \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_PRIV_KEY) \
		--broadcast

PHONY: deploy-rsdc
deploy-rsdc:
	@cd contracts && forge script script/DeployRSDC.s.sol:DeployRSDC \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_PRIV_KEY) \
		--broadcast

PHONY: deploy-contract
deploy-contract:
	@cd contracts && forge create $(CONTRACT_NAME) \
		--broadcast \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_PRIV_KEY) --constructor-args $(CONSTRUCTOR_ARGS) \

PHONY: deploy-contract-without-params
deploy-contract-without-params:
	@cd contracts && forge create $(CONTRACT_NAME) \
		--broadcast \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_PRIV_KEY)

PHONY: mint
mint:
	@cd contracts && cast send --rpc-url $(SEPOLIA_RPC_URL) \
		--private-key $(SEPOLIA_PRIV_KEY) \
		$(CONTRACT_ADDRESS) "function mint(address,uint256)(bool)" $(ADDRESS) $(AMOUNT)

PHONY: erc20-balance
erc20-balance:
	cd contracts && cast call --rpc-url $(SEPOLIA_RPC_URL) \
	 $(CONTRACT_ADDRESS) "function balanceOf(address)(uint256)" $(ADDRESS)

PHONY: propose
propose:
	@cd contracts && cast send $(MULTISIG_CONTRACT_ADDRESS) "function propose(address,uint256)(bytes32)" 0x1234567890123456789012345678901234567890 100000000000000000 --private-key $(SEPOLIA_PRIV_KEY) --rpc-url $(SEPOLIA_RPC_URL)

PHONY: get-transaction
get-transaction:
	@cd contracts && cast call $(MULTISIG_CONTRACT_ADDRESS) "function getTransaction(bytes32)(bytes32,address,uint256,uint256)" $(TX_HASH) --private-key $(SEPOLIA_PRIV_KEY) --rpc-url $(SEPOLIA_RPC_URL)

PHONY: test
test: 
	cd contracts && forge test -vvv