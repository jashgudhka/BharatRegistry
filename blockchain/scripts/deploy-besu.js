const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Bharat Registry ecosystem to Besu Network...");
  console.log("================================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Check gas price (should be 0)
  const gasPrice = await hre.ethers.provider.getFeeData();
  console.log(
    "⚡ Gas Price:",
    gasPrice.gasPrice?.toString() || "0",
    "(should be 0 for free transactions)\n",
  );

  // Deploy LandRegistry
  console.log("📦 Deploying LandRegistry contract...");
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const landRegistry = await LandRegistry.deploy({
    gasPrice: 0, // Force zero gas price
  });
  await landRegistry.waitForDeployment();
  const landRegistryAddress = await landRegistry.getAddress();
  console.log("✅ LandRegistry deployed to:", landRegistryAddress);

  // Deploy IdentityRegistry
  console.log("\n📦 Deploying IdentityRegistry contract...");
  const IdentityRegistry = await hre.ethers.getContractFactory(
    "IdentityRegistry",
  );
  const identityRegistry = await IdentityRegistry.deploy({
    gasPrice: 0,
  });
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  console.log("✅ IdentityRegistry deployed to:", identityRegistryAddress);

  // Deploy DocumentRegistry
  console.log("\n📦 Deploying DocumentRegistry contract...");
  const DocumentRegistry = await hre.ethers.getContractFactory(
    "DocumentRegistry",
  );
  const documentRegistry = await DocumentRegistry.deploy({
    gasPrice: 0,
  });
  await documentRegistry.waitForDeployment();
  const documentRegistryAddress = await documentRegistry.getAddress();
  console.log("✅ DocumentRegistry deployed to:", documentRegistryAddress);

  // Deploy MortgageRegistry
  console.log("\n📦 Deploying MortgageRegistry contract...");
  const MortgageRegistry = await hre.ethers.getContractFactory(
    "MortgageRegistry",
  );
  const mortgageRegistry = await MortgageRegistry.deploy(landRegistryAddress, {
    gasPrice: 0,
  });
  await mortgageRegistry.waitForDeployment();
  const mortgageRegistryAddress = await mortgageRegistry.getAddress();
  console.log("✅ MortgageRegistry deployed to:", mortgageRegistryAddress);

  // Deploy DisputeResolution
  console.log("\n📦 Deploying DisputeResolution contract...");
  const DisputeResolution = await hre.ethers.getContractFactory(
    "DisputeResolution",
  );
  const disputeResolution = await DisputeResolution.deploy({
    gasPrice: 0,
  });
  await disputeResolution.waitForDeployment();
  const disputeResolutionAddress = await disputeResolution.getAddress();
  console.log("✅ DisputeResolution deployed to:", disputeResolutionAddress);

  // Deploy TitleInsurance
  console.log("\n📦 Deploying TitleInsurance contract...");
  const TitleInsurance = await hre.ethers.getContractFactory("TitleInsurance");
  const titleInsurance = await TitleInsurance.deploy(disputeResolutionAddress, {
    gasPrice: 0,
  });
  await titleInsurance.waitForDeployment();
  const titleInsuranceAddress = await titleInsurance.getAddress();
  console.log("✅ TitleInsurance deployed to:", titleInsuranceAddress);

  // Deploy PropertyToken
  console.log("\n📦 Deploying PropertyToken contract...");
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy(
    landRegistryAddress,
    "https://bharat-registry.local/token/{id}.json",
    {
      gasPrice: 0,
    },
  );
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log("✅ PropertyToken deployed to:", propertyTokenAddress);

  // Deploy Transfer
  console.log("\n📦 Deploying Transfer contract...");
  const Transfer = await hre.ethers.getContractFactory("Transfer");
  const transfer = await Transfer.deploy(landRegistryAddress, {
    gasPrice: 0, // Force zero gas price
  });
  await transfer.waitForDeployment();
  const transferAddress = await transfer.getAddress();
  console.log("✅ Transfer deployed to:", transferAddress);

  // Grant roles
  console.log("\n🔐 Setting up roles...");

  const ADMIN_ROLE = await landRegistry.DEFAULT_ADMIN_ROLE();
  const REGISTRAR_ROLE = await landRegistry.REGISTRAR_ROLE();
  const VERIFIER_ROLE = await landRegistry.VERIFIER_ROLE();

  // Grant deployer all roles for testing
  console.log("   Granting ADMIN_ROLE to deployer...");
  await (
    await landRegistry.grantRole(ADMIN_ROLE, deployer.address, { gasPrice: 0 })
  ).wait();

  console.log("   Granting REGISTRAR_ROLE to deployer...");
  await (
    await landRegistry.grantRole(REGISTRAR_ROLE, deployer.address, {
      gasPrice: 0,
    })
  ).wait();

  console.log("   Granting VERIFIER_ROLE to deployer...");
  await (
    await landRegistry.grantRole(VERIFIER_ROLE, deployer.address, {
      gasPrice: 0,
    })
  ).wait();

  console.log("   Granting REGISTRAR_ROLE to Transfer contract...");
  await (
    await landRegistry.grantRole(REGISTRAR_ROLE, transferAddress, {
      gasPrice: 0,
    })
  ).wait();

  console.log("   Linking Transfer compliance modules...");
  await (
    await transfer.setComplianceModules(
      mortgageRegistryAddress,
      disputeResolutionAddress,
      {
        gasPrice: 0,
      },
    )
  ).wait();

  console.log("✅ Roles configured\n");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      LandRegistry: {
        address: landRegistryAddress,
        roles: {
          ADMIN_ROLE: ADMIN_ROLE,
          REGISTRAR_ROLE: REGISTRAR_ROLE,
          VERIFIER_ROLE: VERIFIER_ROLE,
        },
      },
      Transfer: {
        address: transferAddress,
      },
      DocumentRegistry: {
        address: documentRegistryAddress,
      },
      IdentityRegistry: {
        address: identityRegistryAddress,
      },
      MortgageRegistry: {
        address: mortgageRegistryAddress,
      },
      DisputeResolution: {
        address: disputeResolutionAddress,
      },
      TitleInsurance: {
        address: titleInsuranceAddress,
      },
      PropertyToken: {
        address: propertyTokenAddress,
      },
    },
    gasPrice: "0 (FREE)",
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `besu-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("📄 Deployment info saved to:", deploymentFile);
  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT SUCCESSFUL - ZERO GAS NETWORK READY!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   LandRegistry:", landRegistryAddress);
  console.log("   Transfer:", transferAddress);
  console.log("   DocumentRegistry:", documentRegistryAddress);
  console.log("   IdentityRegistry:", identityRegistryAddress);
  console.log("   MortgageRegistry:", mortgageRegistryAddress);
  console.log("   DisputeResolution:", disputeResolutionAddress);
  console.log("   TitleInsurance:", titleInsuranceAddress);
  console.log("   PropertyToken:", propertyTokenAddress);
  console.log("\n⚡ All transactions are FREE (gasPrice = 0)");
  console.log("\n📝 Next Steps:");
  console.log("   1. Update backend/.env with these addresses:");
  console.log(`      LAND_REGISTRY_ADDRESS=${landRegistryAddress}`);
  console.log(`      TRANSFER_ADDRESS=${transferAddress}`);
  console.log(`      DOCUMENT_REGISTRY_ADDRESS=${documentRegistryAddress}`);
  console.log(`      IDENTITY_REGISTRY_ADDRESS=${identityRegistryAddress}`);
  console.log(`      MORTGAGE_REGISTRY_ADDRESS=${mortgageRegistryAddress}`);
  console.log(`      DISPUTE_RESOLUTION_ADDRESS=${disputeResolutionAddress}`);
  console.log(`      TITLE_INSURANCE_ADDRESS=${titleInsuranceAddress}`);
  console.log(`      PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
  console.log(`      RPC_URL=http://127.0.0.1:8545`);
  console.log("\n   2. Update frontend/.env:");
  console.log(`      VITE_LAND_REGISTRY_ADDRESS=${landRegistryAddress}`);
  console.log(`      VITE_TRANSFER_ADDRESS=${transferAddress}`);
  console.log(
    `      VITE_DOCUMENT_REGISTRY_ADDRESS=${documentRegistryAddress}`,
  );
  console.log(
    `      VITE_IDENTITY_REGISTRY_ADDRESS=${identityRegistryAddress}`,
  );
  console.log(
    `      VITE_MORTGAGE_REGISTRY_ADDRESS=${mortgageRegistryAddress}`,
  );
  console.log(
    `      VITE_DISPUTE_RESOLUTION_ADDRESS=${disputeResolutionAddress}`,
  );
  console.log(`      VITE_TITLE_INSURANCE_ADDRESS=${titleInsuranceAddress}`);
  console.log(`      VITE_PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
  console.log(`      VITE_RPC_URL=http://127.0.0.1:8545`);
  console.log(`      VITE_CHAIN_ID=1337`);
  console.log("\n   3. Restart backend and frontend services");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
