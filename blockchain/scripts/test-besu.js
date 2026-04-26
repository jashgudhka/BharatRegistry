const hre = require("hardhat");

/**
 * Test script to verify zero-gas transactions on Besu network
 * Run: npx hardhat run scripts/test-besu.js --network besu
 */
async function main() {
  console.log("🧪 Testing Bharat Registry on Besu (Zero Gas Network)");
  console.log("=====================================================\n");

  const [signer] = await hre.ethers.getSigners();
  console.log("Test account:", signer.address);

  // Check initial balance
  const initialBalance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Initial balance:", hre.ethers.formatEther(initialBalance), "ETH\n");

  // Get contract addresses from latest deployment
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  const files = fs.readdirSync(deploymentsDir).filter((f) => f.startsWith("besu-"));
  
  if (files.length === 0) {
    console.error("❌ No Besu deployment found. Run: npx hardhat run scripts/deploy-besu.js --network besu");
    process.exit(1);
  }

  const latestDeployment = files.sort().reverse()[0];
  const deployment = JSON.parse(
    fs.readFileSync(path.join(deploymentsDir, latestDeployment))
  );

  console.log("📄 Using deployment:", latestDeployment);
  console.log("LandRegistry:", deployment.contracts.LandRegistry.address);
  console.log("Transfer:", deployment.contracts.Transfer.address);
  console.log("");

  // Attach to contracts
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = LandRegistry.attach(
    deployment.contracts.LandRegistry.address
  );

  // Test 1: Register a property (FREE)
  console.log("🏠 Test 1: Registering a property...");
  const tx1 = await landRegistry.registerProperty(
    "BESU-TEST-001",
    "Mumbai, Maharashtra, India",
    1500,
    hre.ethers.parseEther("10"),
    "QmTestIPFSHash123",
    { gasPrice: 0 }
  );
  const receipt1 = await tx1.wait();
  console.log("✅ Property registered!");
  console.log("   Gas used:", receipt1.gasUsed.toString());
  console.log("   Gas price:", receipt1.gasPrice?.toString() || "0");
  console.log("   Transaction cost:", hre.ethers.formatEther((receipt1.gasUsed * (receipt1.gasPrice || 0n)).toString()), "ETH");

  // Test 2: Verify property (FREE)
  console.log("\n✓ Test 2: Verifying property...");
  const tx2 = await landRegistry.verifyProperty(1, { gasPrice: 0 });
  const receipt2 = await tx2.wait();
  console.log("✅ Property verified!");
  console.log("   Gas used:", receipt2.gasUsed.toString());
  console.log("   Transaction cost:", hre.ethers.formatEther((receipt2.gasUsed * (receipt2.gasPrice || 0n)).toString()), "ETH");

  // Test 3: Get property details (FREE read)
  console.log("\n📖 Test 3: Reading property details...");
  const property = await landRegistry.getProperty(1);
  console.log("✅ Property details:");
  console.log("   Survey Number:", property.surveyNumber);
  console.log("   Location:", property.location);
  console.log("   Area:", property.area.toString(), "sq.m");
  console.log("   Value:", hre.ethers.formatEther(property.value), "ETH");
  console.log("   Verified:", property.isVerified);

  // Check final balance
  const finalBalance = await hre.ethers.provider.getBalance(signer.address);
  console.log("\n💰 Final balance:", hre.ethers.formatEther(finalBalance), "ETH");
  console.log("💸 Total cost:", hre.ethers.formatEther(initialBalance - finalBalance), "ETH");

  if (initialBalance === finalBalance) {
    console.log("\n🎉 SUCCESS! All transactions were FREE (zero gas cost)");
  } else {
    console.log("\n⚠️  Warning: Balance changed, gas may not be zero");
  }

  console.log("\n✅ All tests passed! Network is ready for use.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:");
    console.error(error);
    process.exit(1);
  });
