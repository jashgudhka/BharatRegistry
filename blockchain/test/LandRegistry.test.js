const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("LandRegistry", function () {
  // Fixture to deploy contracts
  async function deployLandRegistryFixture() {
    const [owner, verifier, registrar, user1, user2] =
      await ethers.getSigners();

    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();

    // Grant roles
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
    const REGISTRAR_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("REGISTRAR_ROLE"),
    );

    await landRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);

    return {
      landRegistry,
      owner,
      verifier,
      registrar,
      user1,
      user2,
      VERIFIER_ROLE,
      REGISTRAR_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      const { landRegistry, owner } = await loadFixture(
        deployLandRegistryFixture,
      );

      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      expect(await landRegistry.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have zero properties initially", async function () {
      const { landRegistry } = await loadFixture(deployLandRegistryFixture);

      expect(await landRegistry.getTotalProperties()).to.equal(0);
    });
  });

  describe("Property Registration", function () {
    it("Should register a new property", async function () {
      const { landRegistry, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      const tx = await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai, Maharashtra",
          1000,
          ethers.parseEther("10"),
          "QmTestHash123",
        );

      await expect(tx)
        .to.emit(landRegistry, "PropertyRegistered")
        .withArgs(1, user1.address, "SV-2024-001");

      const property = await landRegistry.getProperty(1);
      expect(property.surveyNumber).to.equal("SV-2024-001");
      expect(property.currentOwner).to.equal(user1.address);
      expect(property.status).to.equal(0); // Pending
    });

    it("Should not register duplicate survey numbers", async function () {
      const { landRegistry, user1, user2 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai, Maharashtra",
          1000,
          ethers.parseEther("10"),
          "QmTestHash123",
        );

      await expect(
        landRegistry
          .connect(user2)
          .registerProperty(
            "SV-2024-001",
            "Delhi",
            500,
            ethers.parseEther("5"),
            "QmTestHash456",
          ),
      ).to.be.revertedWith("LandRegistry: Property already registered");
    });

    it("Should require survey number", async function () {
      const { landRegistry, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await expect(
        landRegistry
          .connect(user1)
          .registerProperty(
            "",
            "Mumbai, Maharashtra",
            1000,
            ethers.parseEther("10"),
            "QmTestHash123",
          ),
      ).to.be.revertedWith("LandRegistry: Survey number required");
    });

    it("Should require positive area", async function () {
      const { landRegistry, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await expect(
        landRegistry
          .connect(user1)
          .registerProperty(
            "SV-2024-001",
            "Mumbai, Maharashtra",
            0,
            ethers.parseEther("10"),
            "QmTestHash123",
          ),
      ).to.be.revertedWith("LandRegistry: Area must be greater than 0");
    });
  });

  describe("Property Verification", function () {
    it("Should allow verifier to verify property", async function () {
      const { landRegistry, verifier, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai, Maharashtra",
          1000,
          ethers.parseEther("10"),
          "QmTestHash123",
        );

      await expect(landRegistry.connect(verifier).verifyProperty(1))
        .to.emit(landRegistry, "PropertyVerified")
        .withArgs(1, verifier.address);

      const property = await landRegistry.getProperty(1);
      expect(property.status).to.equal(1); // Verified
    });

    it("Should not allow non-verifier to verify", async function () {
      const { landRegistry, user1, user2 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai, Maharashtra",
          1000,
          ethers.parseEther("10"),
          "QmTestHash123",
        );

      await expect(landRegistry.connect(user2).verifyProperty(1)).to.be
        .reverted;
    });

    it("Should allow re-verification after transfer", async function () {
      const { landRegistry, verifier, registrar, user1, user2 } =
        await loadFixture(deployLandRegistryFixture);

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-REVERIFY",
          "Pune, Maharashtra",
          900,
          ethers.parseEther("8"),
          "QmReverifyHash",
        );

      await landRegistry.connect(verifier).verifyProperty(1);
      expect(await landRegistry.getTotalVerifiedProperties()).to.equal(1);

      await landRegistry.connect(registrar).transferOwnership(1, user2.address);

      const transferredProperty = await landRegistry.getProperty(1);
      expect(transferredProperty.status).to.equal(3); // Transferred
      expect(await landRegistry.getTotalVerifiedProperties()).to.equal(0);

      await landRegistry.connect(verifier).verifyProperty(1);

      const reverifiedProperty = await landRegistry.getProperty(1);
      expect(reverifiedProperty.status).to.equal(1); // Verified
      expect(await landRegistry.getTotalVerifiedProperties()).to.equal(1);
    });
  });

  describe("Property Queries", function () {
    it("Should get owner properties", async function () {
      const { landRegistry, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai",
          1000,
          ethers.parseEther("10"),
          "QmHash1",
        );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-002",
          "Delhi",
          500,
          ethers.parseEther("5"),
          "QmHash2",
        );

      const properties = await landRegistry.getOwnerProperties(user1.address);
      expect(properties.length).to.equal(2);
      expect(properties[0]).to.equal(1);
      expect(properties[1]).to.equal(2);
    });

    it("Should get property by survey number", async function () {
      const { landRegistry, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry
        .connect(user1)
        .registerProperty(
          "SV-2024-001",
          "Mumbai, Maharashtra",
          1000,
          ethers.parseEther("10"),
          "QmTestHash123",
        );

      const property = await landRegistry.getPropertyBySurveyNumber(
        "SV-2024-001",
      );
      expect(property.propertyId).to.equal(1);
      expect(property.location).to.equal("Mumbai, Maharashtra");
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      const { landRegistry, owner } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry.connect(owner).pause();

      // Contract should be paused
      await expect(
        landRegistry
          .connect(owner)
          .registerProperty(
            "SV-2024-001",
            "Mumbai",
            1000,
            ethers.parseEther("10"),
            "QmHash",
          ),
      ).to.be.revertedWithCustomError(landRegistry, "EnforcedPause");
    });

    it("Should allow admin to unpause", async function () {
      const { landRegistry, owner, user1 } = await loadFixture(
        deployLandRegistryFixture,
      );

      await landRegistry.connect(owner).pause();
      await landRegistry.connect(owner).unpause();

      // Should work after unpause
      await expect(
        landRegistry
          .connect(user1)
          .registerProperty(
            "SV-2024-001",
            "Mumbai",
            1000,
            ethers.parseEther("10"),
            "QmHash",
          ),
      ).to.not.be.reverted;
    });
  });
});
