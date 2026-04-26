// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IdentityRegistry
 * @notice On-chain KYC and accredited-role registry for users and institutions.
 */
contract IdentityRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    enum IdentityStatus {
        None,
        Pending,
        Verified,
        Rejected,
        Suspended
    }

    enum AccreditedRole {
        None,
        Citizen,
        Bank,
        Registrar,
        Verifier,
        Insurer,
        Auditor,
        Juror
    }

    struct IdentityProfile {
        address account;
        string identityHash;
        string metadataURI;
        IdentityStatus status;
        uint64 submittedAt;
        uint64 decidedAt;
        address reviewedBy;
        string reviewNotes;
    }

    mapping(address => IdentityProfile) private _profiles;
    mapping(address => mapping(AccreditedRole => bool)) private _accreditedRoles;

    event IdentitySubmitted(address indexed account, string identityHash, string metadataURI);
    event IdentityReviewed(address indexed account, address indexed reviewer, bool approved, string notes);
    event IdentitySuspended(address indexed account, address indexed auditor, string reason);
    event AccreditedRoleGranted(address indexed account, AccreditedRole indexed role, address indexed grantedBy);
    event AccreditedRoleRevoked(address indexed account, AccreditedRole indexed role, address indexed revokedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(AUDITOR_ROLE, msg.sender);
    }

    modifier profileExists(address account) {
        require(_profiles[account].submittedAt != 0, "IdentityRegistry: profile not found");
        _;
    }

    function submitIdentity(string calldata identityHash, string calldata metadataURI) external whenNotPaused {
        require(bytes(identityHash).length > 0, "IdentityRegistry: identity hash required");

        IdentityProfile storage profile = _profiles[msg.sender];
        require(profile.status != IdentityStatus.Verified, "IdentityRegistry: already verified");

        profile.account = msg.sender;
        profile.identityHash = identityHash;
        profile.metadataURI = metadataURI;
        profile.status = IdentityStatus.Pending;
        profile.submittedAt = uint64(block.timestamp);
        profile.decidedAt = 0;
        profile.reviewedBy = address(0);
        profile.reviewNotes = "";

        emit IdentitySubmitted(msg.sender, identityHash, metadataURI);
    }

    function reviewIdentity(address account, bool approved, string calldata notes)
        external
        onlyRole(VERIFIER_ROLE)
        profileExists(account)
        whenNotPaused
    {
        IdentityProfile storage profile = _profiles[account];
        require(
            profile.status == IdentityStatus.Pending ||
                profile.status == IdentityStatus.Rejected ||
                profile.status == IdentityStatus.Suspended,
            "IdentityRegistry: profile not reviewable"
        );

        profile.status = approved ? IdentityStatus.Verified : IdentityStatus.Rejected;
        profile.decidedAt = uint64(block.timestamp);
        profile.reviewedBy = msg.sender;
        profile.reviewNotes = notes;

        emit IdentityReviewed(account, msg.sender, approved, notes);
    }

    function suspendIdentity(address account, string calldata reason)
        external
        onlyRole(AUDITOR_ROLE)
        profileExists(account)
        whenNotPaused
    {
        IdentityProfile storage profile = _profiles[account];
        require(profile.status == IdentityStatus.Verified, "IdentityRegistry: only verified profile can be suspended");

        profile.status = IdentityStatus.Suspended;
        profile.decidedAt = uint64(block.timestamp);
        profile.reviewedBy = msg.sender;
        profile.reviewNotes = reason;

        emit IdentitySuspended(account, msg.sender, reason);
    }

    function grantAccreditedRole(address account, AccreditedRole roleId) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "IdentityRegistry: invalid account");
        require(roleId != AccreditedRole.None, "IdentityRegistry: invalid role");

        _accreditedRoles[account][roleId] = true;
        emit AccreditedRoleGranted(account, roleId, msg.sender);
    }

    function revokeAccreditedRole(address account, AccreditedRole roleId) external onlyRole(ADMIN_ROLE) {
        require(roleId != AccreditedRole.None, "IdentityRegistry: invalid role");

        _accreditedRoles[account][roleId] = false;
        emit AccreditedRoleRevoked(account, roleId, msg.sender);
    }

    function hasActiveKyc(address account) external view returns (bool) {
        return _profiles[account].status == IdentityStatus.Verified;
    }

    function hasAccreditedRole(address account, AccreditedRole roleId) external view returns (bool) {
        return _accreditedRoles[account][roleId];
    }

    function getIdentity(address account)
        external
        view
        profileExists(account)
        returns (IdentityProfile memory)
    {
        return _profiles[account];
    }

    function addVerifier(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, account);
    }

    function removeVerifier(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, account);
    }

    function addAuditor(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AUDITOR_ROLE, account);
    }

    function removeAuditor(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(AUDITOR_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}