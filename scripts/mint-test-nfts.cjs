const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🎨 Minting Test Genesis Badges for Marketplace Demo...\n");

  const [signer] = await ethers.getSigners();
  console.log("Connected account:", signer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "ETH\n");

  const addresses = {
    sgtToken: process.env.VITE_CONTRACT_ADDRESS,
    genesisBadge: process.env.VITE_GENESIS_BADGE_ADDRESS,
    staking: process.env.VITE_NFT_STAKING_ADDRESS,
  };

  for (const [name, address] of Object.entries(addresses)) {
    if (!address) {
      console.error(`❌ ${name} address not set in .env`);
      process.exit(1);
    }
  }

  const SGTToken = await ethers.getContractAt("ScrollGenToken", addresses.sgtToken);
  const NFTStaking = await ethers.getContractAt("NFTStaking", addresses.staking);
  const GenesisBadge = await ethers.getContractAt("GenesisBadge", addresses.genesisBadge);

  console.log("📊 Current Status");
  console.log("=".repeat(60));

  const sgtBalance = await SGTToken.balanceOf(signer.address);
  console.log("Your SGT Balance:", ethers.formatUnits(sgtBalance, 18), "SGT");

  const badgeBalance = await GenesisBadge.balanceOf(signer.address);
  console.log("Your Current Badges:", badgeBalance.toString());

  const totalSupply = await GenesisBadge.totalSupply();
  console.log("Total Minted:", totalSupply.toString());

  console.log("\n🎯 Badge Tier Requirements:");
  console.log("=".repeat(60));
  const tiers = [
    { name: "Bronze", amount: "100", days: 1 },
    { name: "Silver", amount: "500", days: 7 },
    { name: "Gold", amount: "1000", days: 30 },
    { name: "Platinum", amount: "5000", days: 90 },
    { name: "Diamond", amount: "10000", days: 180 },
  ];

  tiers.forEach((tier, i) => {
    console.log(`${i}. ${tier.name}: ${tier.amount} SGT for ${tier.days} days`);
  });

  console.log("\n📋 Minting Strategy:");
  console.log("=".repeat(60));
  console.log("We'll mint 5 badges (one of each tier) by:");
  console.log("1. Staking required amount");
  console.log("2. Fast-forwarding time (testnet only)");
  console.log("3. Claiming the badge");
  console.log("4. Unstaking and repeating\n");

  const stakeInfo = await NFTStaking.getStakeInfo(signer.address);
  if (stakeInfo.amount > 0n) {
    console.log("⚠️  You have an active stake. Unstaking first...");
    const tx = await NFTStaking.unstake();
    await tx.wait();
    console.log("✅ Unstaked successfully\n");
  }

  console.log("🚀 Starting Badge Minting Process...\n");

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎨 Minting ${tier.name} Badge (Tier ${i})`);
    console.log("=".repeat(60));

    const stakeAmount = ethers.parseUnits(tier.amount, 18);

    console.log(`1️⃣  Checking SGT balance...`);
    const currentBalance = await SGTToken.balanceOf(signer.address);
    if (currentBalance < stakeAmount) {
      console.log(`❌ Insufficient SGT. Need ${tier.amount} SGT, have ${ethers.formatUnits(currentBalance, 18)} SGT`);
      console.log(`💡 Mint more SGT tokens first with the Token tab in the UI`);
      continue;
    }

    console.log(`2️⃣  Approving ${tier.amount} SGT...`);
    const allowance = await SGTToken.allowance(signer.address, addresses.staking);
    if (allowance < stakeAmount) {
      const approveTx = await SGTToken.approve(addresses.staking, ethers.MaxUint256);
      await approveTx.wait();
      console.log("   ✅ Approved");
    } else {
      console.log("   ✅ Already approved");
    }

    console.log(`3️⃣  Staking ${tier.amount} SGT...`);
    const stakeTx = await NFTStaking.stake(stakeAmount);
    await stakeTx.wait();
    console.log("   ✅ Staked");

    console.log(`4️⃣  Fast-forwarding ${tier.days} days...`);
    const secondsToAdvance = tier.days * 24 * 60 * 60;
    await ethers.provider.send("evm_increaseTime", [secondsToAdvance]);
    await ethers.provider.send("evm_mine", []);
    console.log("   ✅ Time advanced");

    console.log(`5️⃣  Checking eligibility...`);
    const canClaim = await NFTStaking.canClaimBadge(signer.address);
    if (!canClaim.eligible) {
      console.log("   ❌ Not eligible yet. Something went wrong.");
      continue;
    }
    const tierName = await GenesisBadge.getTierName(canClaim.tier);
    console.log(`   ✅ Eligible for ${tierName} badge`);

    console.log(`6️⃣  Claiming badge...`);
    const claimTx = await NFTStaking.claimBadge();
    const receipt = await claimTx.wait();

    const badgeClaimedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'BadgeClaimed'
    );

    if (badgeClaimedEvent) {
      const tokenId = badgeClaimedEvent.args.tokenId;
      console.log(`   ✅ Badge claimed! Token ID: ${tokenId}`);
    } else {
      console.log("   ✅ Badge claimed!");
    }

    console.log(`7️⃣  Unstaking...`);
    const unstakeTx = await NFTStaking.unstake();
    await unstakeTx.wait();
    console.log("   ✅ Unstaked");

    console.log(`\n✨ ${tier.name} Badge Minted Successfully!`);
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("🎉 MINTING COMPLETE!");
  console.log("=".repeat(60));

  const finalBadgeBalance = await GenesisBadge.balanceOf(signer.address);
  console.log("Total Badges Minted:", finalBadgeBalance.toString());

  if (finalBadgeBalance > 0n) {
    console.log("\n🏆 Your Genesis Badges:");
    const tokens = await GenesisBadge.tokensOfOwner(signer.address);
    for (const tokenId of tokens) {
      const tier = await GenesisBadge.getTier(tokenId);
      const tierName = await GenesisBadge.getTierName(tier);
      console.log(`  Token #${tokenId}: ${tierName} Badge`);
    }
  }

  console.log("\n💡 Next Steps:");
  console.log("  1. Open the application: npm run dev");
  console.log("  2. Navigate to the 'Marketplace' tab");
  console.log("  3. Go to 'My NFTs' view");
  console.log("  4. List some badges for sale (e.g., 50-500 SGT each)");
  console.log("  5. Switch to 'Browse Marketplace' to see your listings!");
  console.log("\n✅ Your marketplace is now ready to showcase!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  });
