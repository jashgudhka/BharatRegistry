const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Ecosystem Workflows", function () {
  async function deployEcosystemFixture() {
    const [
      owner,
      verifier,
      registrar,
      bank,
      juror,
      insurer,
      seller,
      buyer,
      other,
    ] = await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();

    const Transfer = await ethers.getContractFactory("Transfer");
    const transfer = await Transfer.deploy(await landRegistry.getAddress());

    const DocumentRegistry = await ethers.getContractFactory(
      "DocumentRegistry",
    );
    const documentRegistry = await DocumentRegistry.deploy();

    const IdentityRegistry = await ethers.getContractFactory(
      "IdentityRegistry",
    );
    const identityRegistry = await IdentityRegistry.deploy();

    const MortgageRegistry = await ethers.getContractFactory(
      "MortgageRegistry",
    );
    const mortgageRegistry = await MortgageRegistry.deploy(
      await landRegistry.getAddress(),
    );

    const DisputeResolution = await ethers.getContractFactory(
      "DisputeResolution",
    );
    const disputeResolution = await DisputeResolution.deploy();

    const TitleInsurance = await ethers.getContractFactory("TitleInsurance");
    const titleInsurance = await TitleInsurance.deploy(
      await disputeResolution.getAddress(),
    );

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy(
      await landRegistry.getAddress(),
      "https://bharat-registry.local/token/{id}.json",
    );

    const REGISTRAR_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("REGISTRAR_ROLE"),
    );
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

    await landRegistry.grantRole(REGISTRAR_ROLE, await transfer.getAddress());
    await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
    await landRegistry.grantRole(VERIFIER_ROLE, verifier.address);

    await transfer.grantRole(REGISTRAR_ROLE, registrar.address);

    await transfer.setComplianceModules(
      await mortgageRegistry.getAddress(),
      await disputeResolution.getAddress(),
    );

    await documentRegistry.addVerifier(verifier.address);
    await identityRegistry.addVerifier(verifier.address);
    await mortgageRegistry.addBank(bank.address);
    await disputeResolution.addVerifier(verifier.address);
    await disputeResolution.addJuror(juror.address);
    await titleInsurance.addInsurer(insurer.address);
    await titleInsurance.addClaimsOfficer(juror.address);
    await propertyToken.addTokenizer(seller.address);

    await landRegistry
      .connect(seller)
      .registerProperty(
        "SV-2026-ECOSYS-001",
        "Mumbai, Maharashtra",
        1000,
        ethers.parseEther("20"),
        "QmWorkflowHash001",
      );

    await landRegistry
      .connect(seller)
      .registerProperty(
        "SV-2026-ECOSYS-002",
        "Pune, Maharashtra",
        700,
        ethers.parseEther("12"),
        "QmWorkflowHash002",
      );

    await landRegistry.connect(verifier).verifyProperty(1);
    await landRegistry.connect(verifier).verifyProperty(2);

    return {
      owner,
      verifier,
      registrar,
      bank,
      juror,
      insurer,
      seller,
      buyer,
      other,
      landRegistry,
      transfer,
      documentRegistry,
      identityRegistry,
      mortgageRegistry,
      disputeResolution,
      titleInsurance,
      propertyToken,
    };
  }

  it("stores and verifies document authenticity", async function () {
    const { documentRegistry, verifier, seller } = await loadFixture(
      deployEcosystemFixture,
    );

    const contentHash = ethers.id("dummy:deed:001");

    await documentRegistry.registerDocument(
      contentHash,
      1,
      seller.address,
      0,
      "ipfs://dummy-deed-001",
      "Dummy deed metadata",
    );

    expect(await documentRegistry.isDocumentAuthentic(contentHash)).to.equal(
      false,
    );

    await documentRegistry.connect(verifier).verifyDocument(contentHash);

    expect(await documentRegistry.isDocumentAuthentic(contentHash)).to.equal(
      true,
    );
  });

  it("runs KYC and accredited-role workflow", async function () {
    const { identityRegistry, verifier, buyer } = await loadFixture(
      deployEcosystemFixture,
    );

    await identityRegistry
      .connect(buyer)
      .submitIdentity("kyc:dummy-user-001", "ipfs://dummy-kyc-001");

    await identityRegistry
      .connect(verifier)
      .reviewIdentity(buyer.address, true, "Dummy workflow verifier approval");

    expect(await identityRegistry.hasActiveKyc(buyer.address)).to.equal(true);

    await identityRegistry.grantAccreditedRole(buyer.address, 1);

    expect(await identityRegistry.hasAccreditedRole(buyer.address, 1)).to.equal(
      true,
    );
  });

  it("blocks transfer initiation while lien is active", async function () {
    const { mortgageRegistry, bank, transfer, buyer, seller } =
      await loadFixture(deployEcosystemFixture);

    await mortgageRegistry
      .connect(bank)
      .createLien(
        1,
        seller.address,
        ethers.parseEther("5"),
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
        "DUMMY-LOAN-001",
      );

    await expect(
      transfer.connect(buyer).initiateTransfer(1, ethers.parseEther("8")),
    ).to.be.revertedWith("Transfer: Property has active encumbrance");

    await mortgageRegistry.connect(bank).updateOutstanding(1, 0);

    await expect(
      transfer.connect(buyer).initiateTransfer(1, ethers.parseEther("8")),
    ).to.not.be.reverted;
  });

  it("holds transfer while dispute block exists and resumes after resolution", async function () {
    const {
      transfer,
      buyer,
      seller,
      registrar,
      disputeResolution,
      juror,
      landRegistry,
    } = await loadFixture(deployEcosystemFixture);

    const price = ethers.parseEther("9");
    await transfer.connect(buyer).initiateTransfer(1, price);
    await transfer.connect(buyer).depositEscrow(1, { value: price });
    await transfer.connect(seller).approveTransferAsSeller(1);

    await disputeResolution
      .connect(seller)
      .openDispute(0, 1, 1, buyer.address, true, true, "ipfs://dummy-dispute");

    await expect(
      transfer.connect(registrar).approveTransferAsRegistrar(1),
    ).to.be.revertedWith("Transfer: Property blocked by dispute");

    await disputeResolution
      .connect(juror)
      .resolveDispute(1, 5, false, "ipfs://dummy-resolution");

    await transfer.connect(registrar).approveTransferAsRegistrar(1);
    await transfer.connect(buyer).completeTransfer(1);

    const property = await landRegistry.getProperty(1);
    expect(property.currentOwner).to.equal(buyer.address);
  });

  it("issues title insurance and pays claim after fraud-confirmed dispute", async function () {
    const { titleInsurance, disputeResolution, insurer, juror, buyer, seller } =
      await loadFixture(deployEcosystemFixture);

    await titleInsurance
      .connect(insurer)
      .fundReserve({ value: ethers.parseEther("20") });

    await titleInsurance
      .connect(insurer)
      .issuePolicy(
        1,
        buyer.address,
        ethers.parseEther("0.1"),
        ethers.parseEther("5"),
        Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180,
        "ipfs://dummy-policy-001",
      );

    await disputeResolution
      .connect(buyer)
      .openDispute(0, 1, 0, seller.address, false, false, "ipfs://dummy-claim");

    await disputeResolution
      .connect(juror)
      .resolveDispute(1, 3, false, "ipfs://fraud-confirmed");

    await expect(
      titleInsurance.connect(juror).payoutFromDispute(1, 1),
    ).to.changeEtherBalances(
      [titleInsurance, buyer],
      [ethers.parseEther("-5"), ethers.parseEther("5")],
    );

    const policy = await titleInsurance.getPolicy(1);
    expect(policy.status).to.equal(2); // Claimed
  });

  it("tokenizes property and tracks fractional balances", async function () {
    const { propertyToken, seller, buyer } = await loadFixture(
      deployEcosystemFixture,
    );

    await propertyToken
      .connect(seller)
      .tokenizeProperty(2, 1000, "ipfs://dummy-token-002");

    expect(await propertyToken.balanceShares(2, seller.address)).to.equal(1000);

    await propertyToken
      .connect(seller)
      .safeTransferFrom(seller.address, buyer.address, 2, 250, "0x");

    expect(await propertyToken.balanceShares(2, buyer.address)).to.equal(250);
    expect(await propertyToken.sharePercentageBps(buyer.address, 2)).to.equal(
      2500,
    );
  });
});
