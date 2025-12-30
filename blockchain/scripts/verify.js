const { ethers, run } = require("hardhat");

// Update these addresses after deployment
const LAND_REGISTRY_ADDRESS = "";
const TRANSFER_ADDRESS = "";

async function main() {
  console.log("🔍 Starting contract verification...\n");

  if (!LAND_REGISTRY_ADDRESS || !TRANSFER_ADDRESS) {
    console.error("❌ Please update contract addresses in verify.js");
    process.exit(1);
  }

  // Verify LandRegistry
  console.log("📜 Verifying LandRegistry...");
  try {
    await run("verify:verify", {
      address: LAND_REGISTRY_ADDRESS,
      constructorArguments: [],
    });
    console.log("✅ LandRegistry verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  LandRegistry already verified");
    } else {
      console.error("❌ LandRegistry verification failed:", error.message);
    }
  }

  // Verify Transfer
  console.log("\n📜 Verifying Transfer...");
  try {
    await run("verify:verify", {
      address: TRANSFER_ADDRESS,
      constructorArguments: [LAND_REGISTRY_ADDRESS],
    });
    console.log("✅ Transfer verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Transfer already verified");
    } else {
      console.error("❌ Transfer verification failed:", error.message);
    }
  }

  console.log("\n🎉 Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
