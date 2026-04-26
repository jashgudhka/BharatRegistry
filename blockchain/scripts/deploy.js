const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Bharat Registry full ecosystem deployment...\n");

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

  // Deploy IdentityRegistry
  console.log("\n📜 Deploying IdentityRegistry contract...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("✅ IdentityRegistry deployed to:", identityRegistryAddress);

  // Deploy DocumentRegistry
  console.log("\n📜 Deploying DocumentRegistry contract...");
  const DocumentRegistry = await ethers.getContractFactory("DocumentRegistry");
  const documentRegistry = await DocumentRegistry.deploy();
  await documentRegistry.waitForDeployment();
  const documentRegistryAddress = await documentRegistry.getAddress();
  console.log("✅ DocumentRegistry deployed to:", documentRegistryAddress);

  // Deploy MortgageRegistry
  console.log("\n📜 Deploying MortgageRegistry contract...");
  const MortgageRegistry = await ethers.getContractFactory("MortgageRegistry");
  const mortgageRegistry = await MortgageRegistry.deploy(landRegistryAddress);
  await mortgageRegistry.waitForDeployment();
  const mortgageRegistryAddress = await mortgageRegistry.getAddress();
  console.log("✅ MortgageRegistry deployed to:", mortgageRegistryAddress);

  // Deploy DisputeResolution
  console.log("\n📜 Deploying DisputeResolution contract...");
  const DisputeResolution = await ethers.getContractFactory(
    "DisputeResolution",
  );
  const disputeResolution = await DisputeResolution.deploy();
  await disputeResolution.waitForDeployment();
  const disputeResolutionAddress = await disputeResolution.getAddress();
  console.log("✅ DisputeResolution deployed to:", disputeResolutionAddress);

  // Deploy TitleInsurance
  console.log("\n📜 Deploying TitleInsurance contract...");
  const TitleInsurance = await ethers.getContractFactory("TitleInsurance");
  const titleInsurance = await TitleInsurance.deploy(disputeResolutionAddress);
  await titleInsurance.waitForDeployment();
  const titleInsuranceAddress = await titleInsurance.getAddress();
  console.log("✅ TitleInsurance deployed to:", titleInsuranceAddress);

  // Deploy PropertyToken
  console.log("\n📜 Deploying PropertyToken contract...");
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(
    landRegistryAddress,
    "https://bharat-registry.local/token/{id}.json",
  );
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log("✅ PropertyToken deployed to:", propertyTokenAddress);

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

  // Configure transfer compliance modules
  console.log("\n🛡️ Configuring transfer compliance modules...");
  const complianceTx = await transfer.setComplianceModules(
    mortgageRegistryAddress,
    disputeResolutionAddress,
  );
  await complianceTx.wait();
  console.log("✅ Transfer linked to MortgageRegistry and DisputeResolution");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   LandRegistry:", landRegistryAddress);
  console.log("   Transfer:           ", transferAddress);
  console.log("   DocumentRegistry:   ", documentRegistryAddress);
  console.log("   IdentityRegistry:   ", identityRegistryAddress);
  console.log("   MortgageRegistry:   ", mortgageRegistryAddress);
  console.log("   DisputeResolution:  ", disputeResolutionAddress);
  console.log("   TitleInsurance:     ", titleInsuranceAddress);
  console.log("   PropertyToken:      ", propertyTokenAddress);
  console.log("\n💡 Save these addresses for frontend configuration!");
  console.log("=".repeat(60));

  // Return addresses for verification script
  return {
    landRegistry: landRegistryAddress,
    transfer: transferAddress,
    documentRegistry: documentRegistryAddress,
    identityRegistry: identityRegistryAddress,
    mortgageRegistry: mortgageRegistryAddress,
    disputeResolution: disputeResolutionAddress,
    titleInsurance: titleInsuranceAddress,
    propertyToken: propertyTokenAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
