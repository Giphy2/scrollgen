const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying ScrollGen Phase 2 Contracts to Scroll Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  const sgtTokenAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!sgtTokenAddress) {
    console.error("❌ Please set VITE_CONTRACT_ADDRESS in .env file (Phase 1 token)");
    process.exit(1);
  }

  console.log("📋 Phase 1 SGT Token:", sgtTokenAddress);
  console.log("\n" + "=".repeat(60) + "\n");

  console.log("1️⃣  Deploying GenesisBadge NFT...");
  const GenesisBadge = await ethers.getContractFactory("GenesisBadge");
  const genesisBadge = await GenesisBadge.deploy();
  await genesisBadge.waitForDeployment();
  const badgeAddress = await genesisBadge.getAddress();
  console.log("✅ GenesisBadge deployed:", badgeAddress);

  console.log("\n2️⃣  Deploying NFTStaking...");
  const NFTStaking = await ethers.getContractFactory("NFTStaking");
  const staking = await NFTStaking.deploy(sgtTokenAddress, badgeAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ NFTStaking deployed:", stakingAddress);

  console.log("\n3️⃣  Setting staking contract as minter...");
  const tx1 = await genesisBadge.setMinter(stakingAddress);
  await tx1.wait();
  console.log("✅ Minter set successfully");

  console.log("\n4️⃣  Setting default metadata URIs for tiers...");
  const defaultURIs = [
    "QmBronzeBadgeMetadataHash",
    "QmSilverBadgeMetadataHash",
    "QmGoldBadgeMetadataHash",
    "QmPlatinumBadgeMetadataHash",
    "QmDiamondBadgeMetadataHash"
  ];

  for (let i = 0; i < defaultURIs.length; i++) {
    const tx = await staking.setDefaultMetadataURI(i, defaultURIs[i]);
    await tx.wait();
    console.log(`✅ Set ${["Bronze", "Silver", "Gold", "Platinum", "Diamond"][i]} tier metadata`);
  }

  console.log("\n5️⃣  Deploying NFTMarketplace...");
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy(badgeAddress, sgtTokenAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ NFTMarketplace deployed:", marketplaceAddress);

  console.log("\n6️⃣  Deploying Governance Timelock...");
  const TimelockController = await ethers.getContractFactory("TimelockController");
  const minDelay = 2 * 24 * 60 * 60; // 2 days
  const timelock = await TimelockController.deploy(
    minDelay,
    [],  // proposers (will be set to governor)
    [],  // executors (will be set to governor)
    deployer.address  // admin
  );
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log("✅ Timelock deployed:", timelockAddress);

  console.log("\n7️⃣  Deploying ScrollGenVotesToken (governance-enabled)...");
  const ScrollGenVotesToken = await ethers.getContractFactory("ScrollGenVotesToken");
  const votesToken = await ScrollGenVotesToken.deploy(1000000); // 1M tokens
  await votesToken.waitForDeployment();
  const votesTokenAddress = await votesToken.getAddress();
  console.log("✅ ScrollGenVotesToken deployed:", votesTokenAddress);

  console.log("\n8️⃣  Deploying GenesisGovernor...");
  const GenesisGovernor = await ethers.getContractFactory("GenesisGovernor");
  const governor = await GenesisGovernor.deploy(
    votesTokenAddress,
    timelockAddress
  );
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("✅ GenesisGovernor deployed:", governorAddress);

  console.log("\n9️⃣  Configuring Timelock roles...");
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();

  await (await timelock.grantRole(PROPOSER_ROLE, governorAddress)).wait();
  console.log("✅ Governor granted PROPOSER role");

  await (await timelock.grantRole(EXECUTOR_ROLE, governorAddress)).wait();
  console.log("✅ Governor granted EXECUTOR role");

  await (await timelock.grantRole(CANCELLER_ROLE, governorAddress)).wait();
  console.log("✅ Governor granted CANCELLER role");

  console.log("\n" + "=".repeat(60));
  console.log("\n🎉 Phase 2 Deployment Complete!\n");

  console.log("📝 Contract Addresses:");
  console.log("─".repeat(60));
  console.log("GenesisBadge NFT:      ", badgeAddress);
  console.log("NFTStaking:            ", stakingAddress);
  console.log("NFTMarketplace:        ", marketplaceAddress);
  console.log("Governance Timelock:   ", timelockAddress);
  console.log("ScrollGenVotesToken:   ", votesTokenAddress);
  console.log("GenesisGovernor:       ", governorAddress);
  console.log("─".repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Update .env with these addresses:");
  console.log(`   VITE_GENESIS_BADGE_ADDRESS=${badgeAddress}`);
  console.log(`   VITE_NFT_STAKING_ADDRESS=${stakingAddress}`);
  console.log(`   VITE_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
  console.log(`   VITE_TIMELOCK_ADDRESS=${timelockAddress}`);
  console.log(`   VITE_VOTES_TOKEN_ADDRESS=${votesTokenAddress}`);
  console.log(`   VITE_GOVERNOR_ADDRESS=${governorAddress}`);
  console.log("\n2. Update frontend config files");
  console.log("3. Verify contracts (optional)");
  console.log("4. Upload NFT metadata to IPFS and update URIs");
  console.log("5. Test staking and minting workflow");
  console.log("6. Test marketplace functionality");
  console.log("7. Test governance proposals\n");

  return {
    genesisBadge: badgeAddress,
    staking: stakingAddress,
    marketplace: marketplaceAddress,
    timelock: timelockAddress,
    votesToken: votesTokenAddress,
    governor: governorAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
