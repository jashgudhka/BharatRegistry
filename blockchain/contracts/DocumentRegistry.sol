// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DocumentRegistry
 * @notice Stores and verifies tamper-proof document hashes for registry workflows.
 */
contract DocumentRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum DocumentType {
        Deed,
        Kyc,
        TitleCertificate,
        SurveyReport,
        Insurance,
        Other
    }

    struct DocumentRecord {
        bytes32 contentHash;
        uint256 propertyId;
        address subject;
        address issuer;
        DocumentType documentType;
        uint64 issuedAt;
        uint64 verifiedAt;
        bool revoked;
        string uri;
        string metadata;
    }

    mapping(bytes32 => DocumentRecord) private _documents;
    mapping(uint256 => bytes32[]) private _propertyDocuments;
    mapping(address => bytes32[]) private _subjectDocuments;
    mapping(address => bytes32[]) private _issuerDocuments;

    event DocumentRegistered(
        bytes32 indexed contentHash,
        uint256 indexed propertyId,
        address indexed subject,
        address issuer,
        DocumentType documentType
    );
    event DocumentVerified(bytes32 indexed contentHash, address indexed verifier);
    event DocumentRevoked(bytes32 indexed contentHash, address indexed verifier, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    modifier documentExists(bytes32 contentHash) {
        require(_documents[contentHash].issuedAt != 0, "DocumentRegistry: document not found");
        _;
    }

    function registerDocument(
        bytes32 contentHash,
        uint256 propertyId,
        address subject,
        DocumentType documentType,
        string calldata uri,
        string calldata metadata
    ) external onlyRole(ISSUER_ROLE) whenNotPaused {
        require(contentHash != bytes32(0), "DocumentRegistry: hash required");
        require(subject != address(0), "DocumentRegistry: invalid subject");
        require(_documents[contentHash].issuedAt == 0, "DocumentRegistry: document already exists");

        _documents[contentHash] = DocumentRecord({
            contentHash: contentHash,
            propertyId: propertyId,
            subject: subject,
            issuer: msg.sender,
            documentType: documentType,
            issuedAt: uint64(block.timestamp),
            verifiedAt: 0,
            revoked: false,
            uri: uri,
            metadata: metadata
        });

        _propertyDocuments[propertyId].push(contentHash);
        _subjectDocuments[subject].push(contentHash);
        _issuerDocuments[msg.sender].push(contentHash);

        emit DocumentRegistered(contentHash, propertyId, subject, msg.sender, documentType);
    }

    function verifyDocument(bytes32 contentHash)
        external
        onlyRole(VERIFIER_ROLE)
        documentExists(contentHash)
        whenNotPaused
    {
        DocumentRecord storage record = _documents[contentHash];
        require(!record.revoked, "DocumentRegistry: document revoked");
        require(record.verifiedAt == 0, "DocumentRegistry: already verified");

        record.verifiedAt = uint64(block.timestamp);
        emit DocumentVerified(contentHash, msg.sender);
    }

    function revokeDocument(bytes32 contentHash, string calldata reason)
        external
        onlyRole(VERIFIER_ROLE)
        documentExists(contentHash)
        whenNotPaused
    {
        DocumentRecord storage record = _documents[contentHash];
        require(!record.revoked, "DocumentRegistry: already revoked");

        record.revoked = true;
        emit DocumentRevoked(contentHash, msg.sender, reason);
    }

    function isDocumentAuthentic(bytes32 contentHash) external view returns (bool) {
        DocumentRecord storage record = _documents[contentHash];
        return record.issuedAt != 0 && record.verifiedAt != 0 && !record.revoked;
    }

    function getDocument(bytes32 contentHash)
        external
        view
        documentExists(contentHash)
        returns (DocumentRecord memory)
    {
        return _documents[contentHash];
    }

    function getPropertyDocuments(uint256 propertyId) external view returns (bytes32[] memory) {
        return _propertyDocuments[propertyId];
    }

    function getSubjectDocuments(address subject) external view returns (bytes32[] memory) {
        return _subjectDocuments[subject];
    }

    function getIssuerDocuments(address issuer) external view returns (bytes32[] memory) {
        return _issuerDocuments[issuer];
    }

    function addIssuer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(ISSUER_ROLE, account);
    }

    function removeIssuer(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(ISSUER_ROLE, account);
    }

    function addVerifier(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, account);
    }

    function removeVerifier(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}