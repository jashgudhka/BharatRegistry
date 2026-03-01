const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Transfer", function () {
  // Fixture to deploy contracts
  async function deployTransferFixture() {
    const [owner, registrar, seller, buyer, other] = await ethers.getSigners();

    // Deploy LandRegistry
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = await LandRegistry.deploy();

    // Deploy Transfer
    const Transfer = await ethers.getContractFactory("Transfer");
    const transfer = await Transfer.deploy(await landRegistry.getAddress());

    // Grant roles
    const REGISTRAR_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("REGISTRAR_ROLE")
    );
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

    await landRegistry.grantRole(REGISTRAR_ROLE, await transfer.getAddress());
    await landRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
    await landRegistry.grantRole(VERIFIER_ROLE, owner.address);
    await transfer.grantRole(REGISTRAR_ROLE, registrar.address);

    // Register and verify a property for testing
    await landRegistry
      .connect(seller)
      .registerProperty(
        "SV-2024-001",
        "Mumbai, Maharashtra",
        1000,
        ethers.parseEther("10"),
        "QmTestHash123"
      );
    await landRegistry.connect(owner).verifyProperty(1);

    return {
      landRegistry,
      transfer,
      owner,
      registrar,
      seller,
      buyer,
      other,
      REGISTRAR_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should set the registry address", async function () {
      const { landRegistry, transfer } = await loadFixture(
        deployTransferFixture
      );

      expect(await transfer.registry()).to.equal(
        await landRegistry.getAddress()
      );
    });

    it("Should have zero transfers initially", async function () {
      const { transfer } = await loadFixture(deployTransferFixture);

      expect(await transfer.getTotalTransfers()).to.equal(0);
    });
  });

  describe("Initiate Transfer", function () {
    it("Should initiate a transfer", async function () {
      const { transfer, seller, buyer } = await loadFixture(
        deployTransferFixture
      );

      const price = ethers.parseEther("10");

      await expect(transfer.connect(buyer).initiateTransfer(1, price))
        .to.emit(transfer, "TransferInitiated")
        .withArgs(1, 1, buyer.address, price);

      const transferData = await transfer.getTransfer(1);
      expect(transferData.buyer).to.equal(buyer.address);
      expect(transferData.seller).to.equal(seller.address);
      expect(transferData.status).to.equal(0); // Initiated
    });

    it("Should not allow owner to buy own property", async function () {
      const { transfer, seller } = await loadFixture(deployTransferFixture);

      await expect(
        transfer.connect(seller).initiateTransfer(1, ethers.parseEther("10"))
      ).to.be.revertedWith("Transfer: Cannot buy own property");
    });
  });

  describe("Escrow", function () {
    it("Should deposit escrow", async function () {
      const { transfer, buyer } = await loadFixture(deployTransferFixture);

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);

      await expect(transfer.connect(buyer).depositEscrow(1, { value: price }))
        .to.emit(transfer, "EscrowDeposited")
        .withArgs(1, price);

      const transferData = await transfer.getTransfer(1);
      expect(transferData.escrowAmount).to.equal(price);
      expect(transferData.status).to.equal(1); // EscrowFunded
    });

    it("Should reject insufficient escrow", async function () {
      const { transfer, buyer } = await loadFixture(deployTransferFixture);

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);

      await expect(
        transfer
          .connect(buyer)
          .depositEscrow(1, { value: ethers.parseEther("5") })
      ).to.be.revertedWith("Transfer: Insufficient escrow amount");
    });
  });

  describe("Approvals", function () {
    it("Should allow seller to approve", async function () {
      const { transfer, seller, buyer } = await loadFixture(
        deployTransferFixture
      );

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);
      await transfer.connect(buyer).depositEscrow(1, { value: price });

      await expect(transfer.connect(seller).approveTransferAsSeller(1))
        .to.emit(transfer, "TransferApprovedBySeller")
        .withArgs(1);
    });

    it("Should allow registrar to approve after seller", async function () {
      const { transfer, seller, buyer, registrar } = await loadFixture(
        deployTransferFixture
      );

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);
      await transfer.connect(buyer).depositEscrow(1, { value: price });
      await transfer.connect(seller).approveTransferAsSeller(1);

      await expect(transfer.connect(registrar).approveTransferAsRegistrar(1))
        .to.emit(transfer, "TransferApprovedByRegistrar")
        .withArgs(1, registrar.address);
    });
  });

  describe("Complete Transfer", function () {
    it("Should complete transfer and transfer funds", async function () {
      const { transfer, landRegistry, seller, buyer, registrar } =
        await loadFixture(deployTransferFixture);

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);
      await transfer.connect(buyer).depositEscrow(1, { value: price });
      await transfer.connect(seller).approveTransferAsSeller(1);
      await transfer.connect(registrar).approveTransferAsRegistrar(1);

      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address
      );

      await expect(transfer.connect(buyer).completeTransfer(1))
        .to.emit(transfer, "TransferCompleted")
        .withArgs(1, seller.address, buyer.address);

      // Check property owner changed
      const property = await landRegistry.getProperty(1);
      expect(property.currentOwner).to.equal(buyer.address);

      // Check seller received funds (minus 1% fee)
      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address
      );
      const expectedAmount = (price * 99n) / 100n; // 99% of price
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedAmount);
    });
  });

  describe("Cancel Transfer", function () {
    it("Should cancel and refund escrow", async function () {
      const { transfer, buyer } = await loadFixture(deployTransferFixture);

      const price = ethers.parseEther("10");
      await transfer.connect(buyer).initiateTransfer(1, price);
      await transfer.connect(buyer).depositEscrow(1, { value: price });

      const buyerBalanceBefore = await ethers.provider.getBalance(
        buyer.address
      );

      const tx = await transfer
        .connect(buyer)
        .cancelTransfer(1, "Changed mind");
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should receive refund minus gas
      expect(buyerBalanceAfter + gasUsed - buyerBalanceBefore).to.equal(price);

      const transferData = await transfer.getTransfer(1);
      expect(transferData.status).to.equal(5); // Cancelled
    });
  });
});
