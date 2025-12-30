const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Bharat Registry deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy LandRegistry
  console.log("📜 Deploying LandRegistry contract...");
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy();
  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();
  console.log("✅ LandRegistry deployed to:", landRegistryAddress);

  // Deploy Transfer contract
  console.log("\n📜 Deploying Transfer contract...");
  const Transfer = await ethers.getContractFactory("Transfer");
  const transfer = await Transfer.deploy(landRegistryAddress);
  await transfer.waitForDeployment();
  const transferAddress = await transfer.getAddress();
  console.log("✅ Transfer deployed to:", transferAddress);

  // Grant REGISTRAR_ROLE to Transfer contract
  console.log("\n🔑 Granting REGISTRAR_ROLE to Transfer contract...");
  const REGISTRAR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("REGISTRAR_ROLE"));
  const grantTx = await landRegistry.grantRole(REGISTRAR_ROLE, transferAddress);
  await grantTx.wait();
  console.log("✅ REGISTRAR_ROLE granted to Transfer contract");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   LandRegistry:", landRegistryAddress);
  console.log("   Transfer:    ", transferAddress);
  console.log("\n💡 Save these addresses for frontend configuration!");
  console.log("=".repeat(60));

  // Return addresses for verification script
  return {
    landRegistry: landRegistryAddress,
    transfer: transferAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
