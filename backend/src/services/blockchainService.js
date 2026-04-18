const { ethers } = require("ethers");

// Contract ABIs (simplified - you should import full ABIs from compiled contracts)
const LAND_REGISTRY_ABI = [
  "function registerProperty(string surveyNumber, string location, uint256 area, uint256 marketValue, string ipfsHash) returns (uint256)",
  "function verifyProperty(uint256 propertyId)",
  "function disputeProperty(uint256 propertyId, string reason)",
  "function getProperty(uint256 propertyId) view returns (tuple(uint256 propertyId, string surveyNumber, string location, uint256 area, address currentOwner, uint256 marketValue, uint8 status, uint256 registrationDate, string ipfsDocumentHash))",
  "function getOwnerProperties(address owner) view returns (uint256[])",
  "function getTotalProperties() view returns (uint256)",
  "function isPropertyVerified(uint256 propertyId) view returns (bool)",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string surveyNumber)",
  "event PropertyVerified(uint256 indexed propertyId, address indexed verifier)",
  "event PropertyTransferred(uint256 indexed propertyId, address indexed from, address indexed to)",
];

const TRANSFER_ABI = [
  "function initiateTransfer(uint256 propertyId, uint256 offeredPrice) returns (uint256)",
  "function depositEscrow(uint256 transferId) payable",
  "function approveTransferAsSeller(uint256 transferId)",
  "function approveTransferAsRegistrar(uint256 transferId)",
  "function completeTransfer(uint256 transferId)",
  "function cancelTransfer(uint256 transferId, string reason)",
  "function disputeTransfer(uint256 transferId, string reason)",
  "function getTransfer(uint256 transferId) view returns (tuple(uint256 transferId, uint256 propertyId, address seller, address buyer, uint256 agreedPrice, uint256 escrowAmount, uint8 status, uint256 createdAt, uint256 completedAt))",
  "function getPropertyTransfers(uint256 propertyId) view returns (uint256[])",
  "function getUserTransfers(address user) view returns (uint256[])",
  "event TransferInitiated(uint256 indexed transferId, uint256 indexed propertyId, address indexed buyer, uint256 price)",
  "event EscrowDeposited(uint256 indexed transferId, uint256 amount)",
  "event TransferApprovedBySeller(uint256 indexed transferId)",
  "event TransferApprovedByRegistrar(uint256 indexed transferId, address indexed registrar)",
  "event TransferCompleted(uint256 indexed transferId, address indexed from, address indexed to)",
  "event TransferCancelled(uint256 indexed transferId, string reason)",
  "event TransferDisputed(uint256 indexed transferId, string reason)",
];

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

    this.landRegistryAddress = process.env.LAND_REGISTRY_ADDRESS;
    this.transferAddress = process.env.TRANSFER_ADDRESS;

    this.landRegistry = this.landRegistryAddress
      ? new ethers.Contract(
          this.landRegistryAddress,
          LAND_REGISTRY_ABI,
          this.provider,
        )
      : null;

    this.transfer = this.transferAddress
      ? new ethers.Contract(this.transferAddress, TRANSFER_ABI, this.provider)
      : null;
  }

  getLandRegistryContract() {
    if (!this.landRegistry) {
      throw new Error("LAND_REGISTRY_ADDRESS is not configured");
    }
    return this.landRegistry;
  }

  getTransferContract() {
    if (!this.transfer) {
      throw new Error("TRANSFER_ADDRESS is not configured");
    }
    return this.transfer;
  }

  async getWritableLandRegistryContract() {
    const landRegistry = this.getLandRegistryContract();

    try {
      const signer = process.env.PRIVATE_KEY
        ? new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
        : await this.provider.getSigner();

      return landRegistry.connect(signer);
    } catch (error) {
      throw new Error(
        `Unable to obtain signer for blockchain write operations. Set PRIVATE_KEY or expose an unlocked account on RPC. ${error.message}`,
      );
    }
  }

  async checkConnection(timeoutMs = 3000) {
    try {
      await Promise.race([
        this.provider.send("eth_chainId", []),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("RPC timeout")), timeoutMs);
        }),
      ]);
      return true;
    } catch (error) {
      return false;
    }
  }

  async verifyPropertyOnChain(propertyId) {
    const landRegistry = await this.getWritableLandRegistryContract();
    const tx = await landRegistry.verifyProperty(propertyId);
    await tx.wait();
    return tx;
  }

  async disputePropertyOnChain(propertyId, reason) {
    const landRegistry = await this.getWritableLandRegistryContract();
    const tx = await landRegistry.disputeProperty(propertyId, reason);
    await tx.wait();
    return tx;
  }

  /**
   * Get property details from blockchain
   */
  async getProperty(propertyId) {
    try {
      const property =
        await this.getLandRegistryContract().getProperty(propertyId);
      return {
        propertyId: Number(property.propertyId),
        surveyNumber: property.surveyNumber,
        location: property.location,
        area: Number(property.area),
        currentOwner: property.currentOwner,
        marketValue: property.marketValue.toString(),
        status: this.getPropertyStatus(Number(property.status)),
        registrationDate: new Date(Number(property.registrationDate) * 1000),
        ipfsDocumentHash: property.ipfsDocumentHash,
      };
    } catch (error) {
      throw new Error(`Failed to fetch property: ${error.message}`);
    }
  }

  /**
   * Get all properties owned by an address
   */
  async getOwnerProperties(ownerAddress) {
    try {
      const propertyIds =
        await this.getLandRegistryContract().getOwnerProperties(ownerAddress);
      return propertyIds.map((id) => Number(id));
    } catch (error) {
      throw new Error(`Failed to fetch owner properties: ${error.message}`);
    }
  }

  /**
   * Get total number of properties
   */
  async getTotalProperties() {
    try {
      const total = await this.getLandRegistryContract().getTotalProperties();
      return Number(total);
    } catch (error) {
      throw new Error(`Failed to fetch total properties: ${error.message}`);
    }
  }

  /**
   * Check if property is verified
   */
  async isPropertyVerified(propertyId) {
    try {
      return await this.getLandRegistryContract().isPropertyVerified(
        propertyId,
      );
    } catch (error) {
      throw new Error(
        `Failed to check property verification: ${error.message}`,
      );
    }
  }

  /**
   * Get transfer details
   */
  async getTransfer(transferId) {
    try {
      const transfer = await this.getTransferContract().getTransfer(transferId);
      return {
        transferId: Number(transfer.transferId),
        propertyId: Number(transfer.propertyId),
        seller: transfer.seller,
        buyer: transfer.buyer,
        agreedPrice: transfer.agreedPrice.toString(),
        escrowAmount: transfer.escrowAmount.toString(),
        status: this.getTransferStatus(Number(transfer.status)),
        createdAt: new Date(Number(transfer.createdAt) * 1000),
        completedAt:
          transfer.completedAt > 0
            ? new Date(Number(transfer.completedAt) * 1000)
            : null,
      };
    } catch (error) {
      throw new Error(`Failed to fetch transfer: ${error.message}`);
    }
  }

  /**
   * Get all transfers for a property
   */
  async getPropertyTransfers(propertyId) {
    try {
      const transferIds =
        await this.getTransferContract().getPropertyTransfers(propertyId);
      return transferIds.map((id) => Number(id));
    } catch (error) {
      throw new Error(`Failed to fetch property transfers: ${error.message}`);
    }
  }

  /**
   * Get all transfers for a user
   */
  async getUserTransfers(userAddress) {
    try {
      const transferIds =
        await this.getTransferContract().getUserTransfers(userAddress);
      return transferIds.map((id) => Number(id));
    } catch (error) {
      throw new Error(`Failed to fetch user transfers: ${error.message}`);
    }
  }

  /**
   * Convert property status number to string
   */
  getPropertyStatus(status) {
    const statuses = ["pending", "verified", "disputed", "transferred"];
    return statuses[status] || "unknown";
  }

  /**
   * Convert transfer status number to string
   */
  getTransferStatus(status) {
    const statuses = [
      "initiated",
      "escrow_funded",
      "approved_by_seller",
      "approved_by_registrar",
      "completed",
      "cancelled",
      "disputed",
    ];
    return statuses[status] || "unknown";
  }

  /**
   * Listen to contract events
   */
  setupEventListeners(callbacks = {}) {
    const landRegistry = this.getLandRegistryContract();
    const transfer = this.getTransferContract();

    if (callbacks.onPropertyRegistered) {
      landRegistry.on("PropertyRegistered", callbacks.onPropertyRegistered);
    }
    if (callbacks.onPropertyVerified) {
      landRegistry.on("PropertyVerified", callbacks.onPropertyVerified);
    }
    if (callbacks.onPropertyTransferred) {
      landRegistry.on("PropertyTransferred", callbacks.onPropertyTransferred);
    }
    if (callbacks.onTransferInitiated) {
      transfer.on("TransferInitiated", callbacks.onTransferInitiated);
    }
    if (callbacks.onEscrowDeposited) {
      transfer.on("EscrowDeposited", callbacks.onEscrowDeposited);
    }
    if (callbacks.onTransferApprovedBySeller) {
      transfer.on(
        "TransferApprovedBySeller",
        callbacks.onTransferApprovedBySeller,
      );
    }
    if (callbacks.onTransferApprovedByRegistrar) {
      transfer.on(
        "TransferApprovedByRegistrar",
        callbacks.onTransferApprovedByRegistrar,
      );
    }
    if (callbacks.onTransferCompleted) {
      transfer.on("TransferCompleted", callbacks.onTransferCompleted);
    }
    if (callbacks.onTransferCancelled) {
      transfer.on("TransferCancelled", callbacks.onTransferCancelled);
    }
    if (callbacks.onTransferDisputed) {
      transfer.on("TransferDisputed", callbacks.onTransferDisputed);
    }
  }

  /**
   * Verify a message signature
   */
  verifySignature(message, signature) {
    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      throw new Error(`Failed to verify signature: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();
