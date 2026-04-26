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

const DOCUMENT_REGISTRY_ABI = [
  "function registerDocument(bytes32 contentHash, uint256 propertyId, address subject, uint8 documentType, string uri, string metadata)",
  "function verifyDocument(bytes32 contentHash)",
  "function revokeDocument(bytes32 contentHash, string reason)",
  "function isDocumentAuthentic(bytes32 contentHash) view returns (bool)",
  "function getDocument(bytes32 contentHash) view returns (tuple(bytes32 contentHash, uint256 propertyId, address subject, address issuer, uint8 documentType, uint64 issuedAt, uint64 verifiedAt, bool revoked, string uri, string metadata))",
  "function getPropertyDocuments(uint256 propertyId) view returns (bytes32[])",
  "function getSubjectDocuments(address subject) view returns (bytes32[])",
];

const IDENTITY_REGISTRY_ABI = [
  "function submitIdentity(string identityHash, string metadataURI)",
  "function reviewIdentity(address account, bool approved, string notes)",
  "function suspendIdentity(address account, string reason)",
  "function grantAccreditedRole(address account, uint8 roleId)",
  "function revokeAccreditedRole(address account, uint8 roleId)",
  "function hasActiveKyc(address account) view returns (bool)",
  "function hasAccreditedRole(address account, uint8 roleId) view returns (bool)",
  "function getIdentity(address account) view returns (tuple(address account, string identityHash, string metadataURI, uint8 status, uint64 submittedAt, uint64 decidedAt, address reviewedBy, string reviewNotes))",
];

const MORTGAGE_REGISTRY_ABI = [
  "function createLien(uint256 propertyId, address borrower, uint256 principal, uint64 dueDate, string referenceId) returns (uint256)",
  "function updateOutstanding(uint256 lienId, uint256 outstanding)",
  "function closeLien(uint256 lienId, string reason)",
  "function hasActiveEncumbrance(uint256 propertyId) view returns (bool)",
  "function getLien(uint256 lienId) view returns (tuple(uint256 lienId, uint256 propertyId, address lender, address borrower, uint256 principal, uint256 outstanding, uint64 createdAt, uint64 dueDate, bool active, string referenceId))",
  "function getPropertyLiens(uint256 propertyId) view returns (uint256[])",
];

const DISPUTE_RESOLUTION_ABI = [
  "function openDispute(uint8 disputeType, uint256 propertyId, uint256 transferId, address respondent, bool blockProperty, bool blockTransfer, string evidenceURI) returns (uint256)",
  "function moveToReview(uint256 disputeId)",
  "function resolveDispute(uint256 disputeId, uint8 outcome, bool keepBlocks, string resolutionURI)",
  "function rejectDispute(uint256 disputeId, string reasonURI)",
  "function fileAppeal(uint256 disputeId, string evidenceURI)",
  "function isPropertyBlocked(uint256 propertyId) view returns (bool)",
  "function isTransferBlocked(uint256 transferId) view returns (bool)",
  "function getDispute(uint256 disputeId) view returns (tuple(uint256 disputeId, uint8 disputeType, uint256 propertyId, uint256 transferId, address claimant, address respondent, uint8 status, uint8 outcome, uint64 openedAt, uint64 resolvedAt, bool blocksProperty, bool blocksTransfer, string evidenceURI, string resolutionURI))",
  "function getDisputeSummary(uint256 disputeId) view returns (uint8 status, uint8 outcome, uint256 propertyId, address claimant, address respondent)",
];

const TITLE_INSURANCE_ABI = [
  "function fundReserve() payable",
  "function issuePolicy(uint256 propertyId, address policyHolder, uint256 premium, uint256 coverageAmount, uint64 expiryAt, string policyURI) returns (uint256)",
  "function payoutFromDispute(uint256 policyId, uint256 disputeId)",
  "function getPolicy(uint256 policyId) view returns (tuple(uint256 policyId, uint256 propertyId, address policyHolder, address insurer, uint256 premium, uint256 coverageAmount, uint256 lockedCoverage, uint64 issuedAt, uint64 expiryAt, uint8 status, uint64 claimProcessedAt, uint256 linkedDisputeId, string policyURI))",
  "function getPropertyPolicies(uint256 propertyId) view returns (uint256[])",
  "function reservePool() view returns (uint256)",
];

const PROPERTY_TOKEN_ABI = [
  "function tokenizeProperty(uint256 propertyId, uint256 totalShares, string tokenUri) returns (uint256)",
  "function getTokenizedProperty(uint256 propertyId) view returns (tuple(uint256 propertyId, uint256 totalShares, address originalOwner, uint64 tokenizedAt, string metadataURI, bool active))",
  "function balanceShares(uint256 propertyId, address account) view returns (uint256)",
  "function sharePercentageBps(address account, uint256 propertyId) view returns (uint256)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
];

class BlockchainService {
  constructor() {
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

    this.landRegistryAddress = process.env.LAND_REGISTRY_ADDRESS;
    this.transferAddress = process.env.TRANSFER_ADDRESS;
    this.documentRegistryAddress = process.env.DOCUMENT_REGISTRY_ADDRESS;
    this.identityRegistryAddress = process.env.IDENTITY_REGISTRY_ADDRESS;
    this.mortgageRegistryAddress = process.env.MORTGAGE_REGISTRY_ADDRESS;
    this.disputeResolutionAddress = process.env.DISPUTE_RESOLUTION_ADDRESS;
    this.titleInsuranceAddress = process.env.TITLE_INSURANCE_ADDRESS;
    this.propertyTokenAddress = process.env.PROPERTY_TOKEN_ADDRESS;

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

    this.documentRegistry = this.documentRegistryAddress
      ? new ethers.Contract(
          this.documentRegistryAddress,
          DOCUMENT_REGISTRY_ABI,
          this.provider,
        )
      : null;

    this.identityRegistry = this.identityRegistryAddress
      ? new ethers.Contract(
          this.identityRegistryAddress,
          IDENTITY_REGISTRY_ABI,
          this.provider,
        )
      : null;

    this.mortgageRegistry = this.mortgageRegistryAddress
      ? new ethers.Contract(
          this.mortgageRegistryAddress,
          MORTGAGE_REGISTRY_ABI,
          this.provider,
        )
      : null;

    this.disputeResolution = this.disputeResolutionAddress
      ? new ethers.Contract(
          this.disputeResolutionAddress,
          DISPUTE_RESOLUTION_ABI,
          this.provider,
        )
      : null;

    this.titleInsurance = this.titleInsuranceAddress
      ? new ethers.Contract(
          this.titleInsuranceAddress,
          TITLE_INSURANCE_ABI,
          this.provider,
        )
      : null;

    this.propertyToken = this.propertyTokenAddress
      ? new ethers.Contract(
          this.propertyTokenAddress,
          PROPERTY_TOKEN_ABI,
          this.provider,
        )
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

  getDocumentRegistryContract() {
    if (!this.documentRegistry) {
      throw new Error("DOCUMENT_REGISTRY_ADDRESS is not configured");
    }
    return this.documentRegistry;
  }

  getIdentityRegistryContract() {
    if (!this.identityRegistry) {
      throw new Error("IDENTITY_REGISTRY_ADDRESS is not configured");
    }
    return this.identityRegistry;
  }

  getMortgageRegistryContract() {
    if (!this.mortgageRegistry) {
      throw new Error("MORTGAGE_REGISTRY_ADDRESS is not configured");
    }
    return this.mortgageRegistry;
  }

  getDisputeResolutionContract() {
    if (!this.disputeResolution) {
      throw new Error("DISPUTE_RESOLUTION_ADDRESS is not configured");
    }
    return this.disputeResolution;
  }

  getTitleInsuranceContract() {
    if (!this.titleInsurance) {
      throw new Error("TITLE_INSURANCE_ADDRESS is not configured");
    }
    return this.titleInsurance;
  }

  getPropertyTokenContract() {
    if (!this.propertyToken) {
      throw new Error("PROPERTY_TOKEN_ADDRESS is not configured");
    }
    return this.propertyToken;
  }

  async getSigner() {
    try {
      return process.env.PRIVATE_KEY
        ? new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
        : await this.provider.getSigner();
    } catch (error) {
      throw new Error(
        `Unable to obtain signer for blockchain write operations. Set PRIVATE_KEY or expose an unlocked account on RPC. ${error.message}`,
      );
    }
  }

  async getWritableContract(contract) {
    const signer = await this.getSigner();
    return contract.connect(signer);
  }

  async getWritableLandRegistryContract() {
    return this.getWritableContract(this.getLandRegistryContract());
  }

  async getWritableTransferContract() {
    return this.getWritableContract(this.getTransferContract());
  }

  async getWritableDocumentRegistryContract() {
    return this.getWritableContract(this.getDocumentRegistryContract());
  }

  async getWritableIdentityRegistryContract() {
    return this.getWritableContract(this.getIdentityRegistryContract());
  }

  async getWritableMortgageRegistryContract() {
    return this.getWritableContract(this.getMortgageRegistryContract());
  }

  async getWritableDisputeResolutionContract() {
    return this.getWritableContract(this.getDisputeResolutionContract());
  }

  async getWritableTitleInsuranceContract() {
    return this.getWritableContract(this.getTitleInsuranceContract());
  }

  async getWritablePropertyTokenContract() {
    return this.getWritableContract(this.getPropertyTokenContract());
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

  normalizeDocumentHash(rawHash) {
    if (typeof rawHash !== "string" || !rawHash.trim()) {
      throw new Error("Document hash is required");
    }

    const hash = rawHash.trim();
    if (ethers.isHexString(hash, 32)) {
      return hash;
    }

    return ethers.id(hash);
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

  async registerDocumentOnChain({
    contentHash,
    propertyId,
    subject,
    documentType,
    uri = "",
    metadata = "",
  }) {
    const documentRegistry = await this.getWritableDocumentRegistryContract();
    const tx = await documentRegistry.registerDocument(
      this.normalizeDocumentHash(contentHash),
      propertyId,
      subject,
      documentType,
      uri,
      metadata,
    );
    await tx.wait();
    return tx;
  }

  async verifyDocumentOnChain(contentHash) {
    const documentRegistry = await this.getWritableDocumentRegistryContract();
    const tx = await documentRegistry.verifyDocument(
      this.normalizeDocumentHash(contentHash),
    );
    await tx.wait();
    return tx;
  }

  async isDocumentAuthentic(contentHash) {
    return this.getDocumentRegistryContract().isDocumentAuthentic(
      this.normalizeDocumentHash(contentHash),
    );
  }

  async getDocument(contentHash) {
    const document = await this.getDocumentRegistryContract().getDocument(
      this.normalizeDocumentHash(contentHash),
    );

    return {
      contentHash: document.contentHash,
      propertyId: Number(document.propertyId),
      subject: document.subject,
      issuer: document.issuer,
      documentType: this.getDocumentType(Number(document.documentType)),
      issuedAt: new Date(Number(document.issuedAt) * 1000),
      verifiedAt:
        Number(document.verifiedAt) > 0
          ? new Date(Number(document.verifiedAt) * 1000)
          : null,
      revoked: document.revoked,
      uri: document.uri,
      metadata: document.metadata,
    };
  }

  async submitIdentityOnChain(identityHash, metadataURI) {
    const identityRegistry = await this.getWritableIdentityRegistryContract();
    const tx = await identityRegistry.submitIdentity(identityHash, metadataURI);
    await tx.wait();
    return tx;
  }

  async reviewIdentityOnChain(account, approved, notes) {
    const identityRegistry = await this.getWritableIdentityRegistryContract();
    const tx = await identityRegistry.reviewIdentity(account, approved, notes);
    await tx.wait();
    return tx;
  }

  async grantAccreditedRoleOnChain(account, roleId) {
    const identityRegistry = await this.getWritableIdentityRegistryContract();
    const tx = await identityRegistry.grantAccreditedRole(account, roleId);
    await tx.wait();
    return tx;
  }

  async hasActiveKyc(account) {
    return this.getIdentityRegistryContract().hasActiveKyc(account);
  }

  async getIdentity(account) {
    const identity =
      await this.getIdentityRegistryContract().getIdentity(account);
    return {
      account: identity.account,
      identityHash: identity.identityHash,
      metadataURI: identity.metadataURI,
      status: this.getIdentityStatus(Number(identity.status)),
      submittedAt: new Date(Number(identity.submittedAt) * 1000),
      decidedAt:
        Number(identity.decidedAt) > 0
          ? new Date(Number(identity.decidedAt) * 1000)
          : null,
      reviewedBy: identity.reviewedBy,
      reviewNotes: identity.reviewNotes,
    };
  }

  async createLienOnChain({
    propertyId,
    borrower,
    principal,
    dueDate,
    referenceId,
  }) {
    const mortgageRegistry = await this.getWritableMortgageRegistryContract();
    const tx = await mortgageRegistry.createLien(
      propertyId,
      borrower,
      principal,
      dueDate,
      referenceId,
    );
    await tx.wait();
    return tx;
  }

  async updateLienOutstandingOnChain(lienId, outstanding) {
    const mortgageRegistry = await this.getWritableMortgageRegistryContract();
    const tx = await mortgageRegistry.updateOutstanding(lienId, outstanding);
    await tx.wait();
    return tx;
  }

  async closeLienOnChain(lienId, reason) {
    const mortgageRegistry = await this.getWritableMortgageRegistryContract();
    const tx = await mortgageRegistry.closeLien(lienId, reason);
    await tx.wait();
    return tx;
  }

  async hasActiveEncumbrance(propertyId) {
    return this.getMortgageRegistryContract().hasActiveEncumbrance(propertyId);
  }

  async getLien(lienId) {
    const lien = await this.getMortgageRegistryContract().getLien(lienId);
    return {
      lienId: Number(lien.lienId),
      propertyId: Number(lien.propertyId),
      lender: lien.lender,
      borrower: lien.borrower,
      principal: lien.principal.toString(),
      outstanding: lien.outstanding.toString(),
      createdAt: new Date(Number(lien.createdAt) * 1000),
      dueDate: new Date(Number(lien.dueDate) * 1000),
      active: lien.active,
      referenceId: lien.referenceId,
    };
  }

  async openDisputeOnChain({
    disputeType,
    propertyId,
    transferId,
    respondent,
    blockProperty,
    blockTransfer,
    evidenceURI,
  }) {
    const disputeResolution = await this.getWritableDisputeResolutionContract();
    const tx = await disputeResolution.openDispute(
      disputeType,
      propertyId,
      transferId,
      respondent,
      blockProperty,
      blockTransfer,
      evidenceURI,
    );
    await tx.wait();
    return tx;
  }

  async moveDisputeToReviewOnChain(disputeId) {
    const disputeResolution = await this.getWritableDisputeResolutionContract();
    const tx = await disputeResolution.moveToReview(disputeId);
    await tx.wait();
    return tx;
  }

  async resolveDisputeOnChain(disputeId, outcome, keepBlocks, resolutionURI) {
    const disputeResolution = await this.getWritableDisputeResolutionContract();
    const tx = await disputeResolution.resolveDispute(
      disputeId,
      outcome,
      keepBlocks,
      resolutionURI,
    );
    await tx.wait();
    return tx;
  }

  async rejectDisputeOnChain(disputeId, reasonURI) {
    const disputeResolution = await this.getWritableDisputeResolutionContract();
    const tx = await disputeResolution.rejectDispute(disputeId, reasonURI);
    await tx.wait();
    return tx;
  }

  async fileAppealOnChain(disputeId, evidenceURI) {
    const disputeResolution = await this.getWritableDisputeResolutionContract();
    const tx = await disputeResolution.fileAppeal(disputeId, evidenceURI);
    await tx.wait();
    return tx;
  }

  async isPropertyBlocked(propertyId) {
    return this.getDisputeResolutionContract().isPropertyBlocked(propertyId);
  }

  async isTransferBlocked(transferId) {
    return this.getDisputeResolutionContract().isTransferBlocked(transferId);
  }

  async getDispute(disputeId) {
    const dispute =
      await this.getDisputeResolutionContract().getDispute(disputeId);
    return {
      disputeId: Number(dispute.disputeId),
      disputeType: this.getDisputeType(Number(dispute.disputeType)),
      propertyId: Number(dispute.propertyId),
      transferId: Number(dispute.transferId),
      claimant: dispute.claimant,
      respondent: dispute.respondent,
      status: this.getDisputeStatus(Number(dispute.status)),
      outcome: this.getDisputeOutcome(Number(dispute.outcome)),
      openedAt: new Date(Number(dispute.openedAt) * 1000),
      resolvedAt:
        Number(dispute.resolvedAt) > 0
          ? new Date(Number(dispute.resolvedAt) * 1000)
          : null,
      blocksProperty: dispute.blocksProperty,
      blocksTransfer: dispute.blocksTransfer,
      evidenceURI: dispute.evidenceURI,
      resolutionURI: dispute.resolutionURI,
    };
  }

  async fundInsuranceReserveOnChain(amountWei) {
    const titleInsurance = await this.getWritableTitleInsuranceContract();
    const tx = await titleInsurance.fundReserve({ value: BigInt(amountWei) });
    await tx.wait();
    return tx;
  }

  async issuePolicyOnChain({
    propertyId,
    policyHolder,
    premium,
    coverageAmount,
    expiryAt,
    policyURI,
  }) {
    const titleInsurance = await this.getWritableTitleInsuranceContract();
    const tx = await titleInsurance.issuePolicy(
      propertyId,
      policyHolder,
      premium,
      coverageAmount,
      expiryAt,
      policyURI,
    );
    await tx.wait();
    return tx;
  }

  async payoutClaimFromDisputeOnChain(policyId, disputeId) {
    const titleInsurance = await this.getWritableTitleInsuranceContract();
    const tx = await titleInsurance.payoutFromDispute(policyId, disputeId);
    await tx.wait();
    return tx;
  }

  async getPolicy(policyId) {
    const policy = await this.getTitleInsuranceContract().getPolicy(policyId);
    return {
      policyId: Number(policy.policyId),
      propertyId: Number(policy.propertyId),
      policyHolder: policy.policyHolder,
      insurer: policy.insurer,
      premium: policy.premium.toString(),
      coverageAmount: policy.coverageAmount.toString(),
      lockedCoverage: policy.lockedCoverage.toString(),
      issuedAt: new Date(Number(policy.issuedAt) * 1000),
      expiryAt: new Date(Number(policy.expiryAt) * 1000),
      status: this.getPolicyStatus(Number(policy.status)),
      claimProcessedAt:
        Number(policy.claimProcessedAt) > 0
          ? new Date(Number(policy.claimProcessedAt) * 1000)
          : null,
      linkedDisputeId: Number(policy.linkedDisputeId),
      policyURI: policy.policyURI,
    };
  }

  async tokenizePropertyOnChain(propertyId, totalShares, tokenUri) {
    const propertyToken = await this.getWritablePropertyTokenContract();
    const tx = await propertyToken.tokenizeProperty(
      propertyId,
      totalShares,
      tokenUri,
    );
    await tx.wait();
    return tx;
  }

  async getTokenizedProperty(propertyId) {
    const tokenized =
      await this.getPropertyTokenContract().getTokenizedProperty(propertyId);
    return {
      propertyId: Number(tokenized.propertyId),
      totalShares: Number(tokenized.totalShares),
      originalOwner: tokenized.originalOwner,
      tokenizedAt: new Date(Number(tokenized.tokenizedAt) * 1000),
      metadataURI: tokenized.metadataURI,
      active: tokenized.active,
    };
  }

  async getShareBalance(propertyId, account) {
    const balance = await this.getPropertyTokenContract().balanceShares(
      propertyId,
      account,
    );
    const shareBps = await this.getPropertyTokenContract().sharePercentageBps(
      account,
      propertyId,
    );

    return {
      shares: Number(balance),
      percentageBps: Number(shareBps),
    };
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

  getDocumentType(type) {
    const types = [
      "deed",
      "kyc",
      "title_certificate",
      "survey_report",
      "insurance",
      "other",
    ];
    return types[type] || "unknown";
  }

  getIdentityStatus(status) {
    const statuses = ["none", "pending", "verified", "rejected", "suspended"];
    return statuses[status] || "unknown";
  }

  getDisputeType(disputeType) {
    const types = ["property", "transfer", "mortgage", "document", "insurance"];
    return types[disputeType] || "unknown";
  }

  getDisputeStatus(status) {
    const statuses = [
      "open",
      "under_review",
      "resolved",
      "rejected",
      "appealed",
    ];
    return statuses[status] || "unknown";
  }

  getDisputeOutcome(outcome) {
    const outcomes = [
      "pending",
      "in_favor_claimant",
      "in_favor_respondent",
      "fraud_confirmed",
      "title_invalidated",
      "settlement",
    ];
    return outcomes[outcome] || "unknown";
  }

  getPolicyStatus(status) {
    const statuses = ["active", "expired", "claimed", "cancelled"];
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
