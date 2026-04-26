// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DisputeResolution
 * @notice Registers disputes and exposes block-state checks for transfer gating.
 */
contract DisputeResolution is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant JUROR_ROLE = keccak256("JUROR_ROLE");

    enum DisputeType {
        Property,
        Transfer,
        Mortgage,
        Document,
        Insurance
    }

    enum DisputeStatus {
        Open,
        UnderReview,
        Resolved,
        Rejected,
        Appealed
    }

    enum DisputeOutcome {
        Pending,
        InFavorClaimant,
        InFavorRespondent,
        FraudConfirmed,
        TitleInvalidated,
        Settlement
    }

    struct DisputeCase {
        uint256 disputeId;
        DisputeType disputeType;
        uint256 propertyId;
        uint256 transferId;
        address claimant;
        address respondent;
        DisputeStatus status;
        DisputeOutcome outcome;
        uint64 openedAt;
        uint64 resolvedAt;
        bool blocksProperty;
        bool blocksTransfer;
        string evidenceURI;
        string resolutionURI;
    }

    uint256 private _disputeIdCounter;

    mapping(uint256 => DisputeCase) private _disputes;
    mapping(uint256 => uint256[]) private _propertyDisputes;
    mapping(uint256 => uint256[]) private _transferDisputes;
    mapping(address => uint256[]) private _partyDisputes;

    event DisputeOpened(
        uint256 indexed disputeId,
        DisputeType indexed disputeType,
        uint256 indexed propertyId,
        uint256 transferId,
        address claimant,
        address respondent,
        bool blocksProperty,
        bool blocksTransfer
    );
    event DisputeMovedToReview(uint256 indexed disputeId, address indexed reviewer);
    event DisputeResolved(
        uint256 indexed disputeId,
        address indexed juror,
        DisputeOutcome outcome,
        bool blocksProperty,
        bool blocksTransfer,
        string resolutionURI
    );
    event DisputeRejected(uint256 indexed disputeId, address indexed reviewer, string reasonURI);
    event AppealFiled(uint256 indexed disputeId, address indexed appellant, string evidenceURI);
    event DisputeBlocksLifted(uint256 indexed disputeId, address indexed liftedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(JUROR_ROLE, msg.sender);
    }

    modifier disputeExists(uint256 disputeId) {
        require(_disputes[disputeId].disputeId != 0, "DisputeResolution: dispute not found");
        _;
    }

    function openDispute(
        DisputeType disputeType,
        uint256 propertyId,
        uint256 transferId,
        address respondent,
        bool blockProperty,
        bool blockTransfer,
        string calldata evidenceURI
    ) external whenNotPaused returns (uint256) {
        require(respondent != address(0), "DisputeResolution: invalid respondent");
        require(respondent != msg.sender, "DisputeResolution: claimant/respondent must differ");
        require(propertyId > 0 || transferId > 0, "DisputeResolution: target required");

        _disputeIdCounter++;
        uint256 newDisputeId = _disputeIdCounter;

        _disputes[newDisputeId] = DisputeCase({
            disputeId: newDisputeId,
            disputeType: disputeType,
            propertyId: propertyId,
            transferId: transferId,
            claimant: msg.sender,
            respondent: respondent,
            status: DisputeStatus.Open,
            outcome: DisputeOutcome.Pending,
            openedAt: uint64(block.timestamp),
            resolvedAt: 0,
            blocksProperty: blockProperty,
            blocksTransfer: blockTransfer,
            evidenceURI: evidenceURI,
            resolutionURI: ""
        });

        if (propertyId > 0) {
            _propertyDisputes[propertyId].push(newDisputeId);
        }

        if (transferId > 0) {
            _transferDisputes[transferId].push(newDisputeId);
        }

        _partyDisputes[msg.sender].push(newDisputeId);
        _partyDisputes[respondent].push(newDisputeId);

        emit DisputeOpened(
            newDisputeId,
            disputeType,
            propertyId,
            transferId,
            msg.sender,
            respondent,
            blockProperty,
            blockTransfer
        );

        return newDisputeId;
    }

    function moveToReview(uint256 disputeId)
        external
        onlyRole(VERIFIER_ROLE)
        disputeExists(disputeId)
        whenNotPaused
    {
        DisputeCase storage dispute = _disputes[disputeId];
        require(
            dispute.status == DisputeStatus.Open || dispute.status == DisputeStatus.Appealed,
            "DisputeResolution: invalid status"
        );

        dispute.status = DisputeStatus.UnderReview;
        emit DisputeMovedToReview(disputeId, msg.sender);
    }

    function resolveDispute(
        uint256 disputeId,
        DisputeOutcome outcome,
        bool keepBlocks,
        string calldata resolutionURI
    ) external onlyRole(JUROR_ROLE) disputeExists(disputeId) whenNotPaused {
        DisputeCase storage dispute = _disputes[disputeId];
        require(
            dispute.status == DisputeStatus.Open ||
                dispute.status == DisputeStatus.UnderReview ||
                dispute.status == DisputeStatus.Appealed,
            "DisputeResolution: dispute not resolvable"
        );

        dispute.status = DisputeStatus.Resolved;
        dispute.outcome = outcome;
        dispute.resolutionURI = resolutionURI;
        dispute.resolvedAt = uint64(block.timestamp);

        if (!keepBlocks) {
            dispute.blocksProperty = false;
            dispute.blocksTransfer = false;
        }

        emit DisputeResolved(
            disputeId,
            msg.sender,
            outcome,
            dispute.blocksProperty,
            dispute.blocksTransfer,
            resolutionURI
        );
    }

    function rejectDispute(uint256 disputeId, string calldata reasonURI)
        external
        onlyRole(VERIFIER_ROLE)
        disputeExists(disputeId)
        whenNotPaused
    {
        DisputeCase storage dispute = _disputes[disputeId];
        require(
            dispute.status == DisputeStatus.Open ||
                dispute.status == DisputeStatus.UnderReview ||
                dispute.status == DisputeStatus.Appealed,
            "DisputeResolution: dispute not rejectable"
        );

        dispute.status = DisputeStatus.Rejected;
        dispute.outcome = DisputeOutcome.InFavorRespondent;
        dispute.resolutionURI = reasonURI;
        dispute.resolvedAt = uint64(block.timestamp);

        emit DisputeRejected(disputeId, msg.sender, reasonURI);
    }

    function fileAppeal(uint256 disputeId, string calldata evidenceURI)
        external
        disputeExists(disputeId)
        whenNotPaused
    {
        DisputeCase storage dispute = _disputes[disputeId];
        require(
            (msg.sender == dispute.claimant || msg.sender == dispute.respondent) || hasRole(VERIFIER_ROLE, msg.sender),
            "DisputeResolution: not authorized"
        );
        require(
            dispute.status == DisputeStatus.Resolved || dispute.status == DisputeStatus.Rejected,
            "DisputeResolution: only resolved/rejected can be appealed"
        );

        dispute.status = DisputeStatus.Appealed;
        dispute.outcome = DisputeOutcome.Pending;
        dispute.resolvedAt = 0;
        if (bytes(evidenceURI).length > 0) {
            dispute.evidenceURI = evidenceURI;
        }

        emit AppealFiled(disputeId, msg.sender, evidenceURI);
    }

    function liftDisputeBlocks(uint256 disputeId)
        external
        onlyRole(VERIFIER_ROLE)
        disputeExists(disputeId)
        whenNotPaused
    {
        DisputeCase storage dispute = _disputes[disputeId];
        dispute.blocksProperty = false;
        dispute.blocksTransfer = false;

        emit DisputeBlocksLifted(disputeId, msg.sender);
    }

    function isPropertyBlocked(uint256 propertyId) external view returns (bool) {
        uint256[] storage disputeIds = _propertyDisputes[propertyId];
        for (uint256 i = 0; i < disputeIds.length; i++) {
            DisputeCase storage dispute = _disputes[disputeIds[i]];
            if (dispute.blocksProperty && dispute.status != DisputeStatus.Rejected) {
                return true;
            }
        }

        return false;
    }

    function isTransferBlocked(uint256 transferId) external view returns (bool) {
        uint256[] storage disputeIds = _transferDisputes[transferId];
        for (uint256 i = 0; i < disputeIds.length; i++) {
            DisputeCase storage dispute = _disputes[disputeIds[i]];
            if (dispute.blocksTransfer && dispute.status != DisputeStatus.Rejected) {
                return true;
            }
        }

        return false;
    }

    function getDispute(uint256 disputeId)
        external
        view
        disputeExists(disputeId)
        returns (DisputeCase memory)
    {
        return _disputes[disputeId];
    }

    function getPropertyDisputes(uint256 propertyId) external view returns (uint256[] memory) {
        return _propertyDisputes[propertyId];
    }

    function getTransferDisputes(uint256 transferId) external view returns (uint256[] memory) {
        return _transferDisputes[transferId];
    }

    function getPartyDisputes(address party) external view returns (uint256[] memory) {
        return _partyDisputes[party];
    }

    function getDisputeSummary(uint256 disputeId)
        external
        view
        disputeExists(disputeId)
        returns (uint8 status, uint8 outcome, uint256 propertyId, address claimant, address respondent)
    {
        DisputeCase storage dispute = _disputes[disputeId];
        return (
            uint8(dispute.status),
            uint8(dispute.outcome),
            dispute.propertyId,
            dispute.claimant,
            dispute.respondent
        );
    }

    function addVerifier(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, account);
    }

    function removeVerifier(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, account);
    }

    function addJuror(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(JUROR_ROLE, account);
    }

    function removeJuror(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(JUROR_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
