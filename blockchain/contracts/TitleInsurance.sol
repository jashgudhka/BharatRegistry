// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IDisputeResolutionSummary {
    function getDisputeSummary(uint256 disputeId)
        external
        view
        returns (uint8 status, uint8 outcome, uint256 propertyId, address claimant, address respondent);
}

/**
 * @title TitleInsurance
 * @notice Issues title insurance policies and pays claims based on dispute outcomes.
 */
contract TitleInsurance is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant CLAIMS_ROLE = keccak256("CLAIMS_ROLE");

    enum PolicyStatus {
        Active,
        Expired,
        Claimed,
        Cancelled
    }

    struct Policy {
        uint256 policyId;
        uint256 propertyId;
        address policyHolder;
        address insurer;
        uint256 premium;
        uint256 coverageAmount;
        uint256 lockedCoverage;
        uint64 issuedAt;
        uint64 expiryAt;
        PolicyStatus status;
        uint64 claimProcessedAt;
        uint256 linkedDisputeId;
        string policyURI;
    }

    uint256 private _policyIdCounter;
    uint256 public reservePool;

    IDisputeResolutionSummary public disputeResolution;

    mapping(uint256 => Policy) private _policies;
    mapping(uint256 => uint256[]) private _propertyPolicies;
    mapping(address => uint256[]) private _holderPolicies;

    event ReserveFunded(address indexed insurer, uint256 amount);
    event PolicyIssued(
        uint256 indexed policyId,
        uint256 indexed propertyId,
        address indexed holder,
        address insurer,
        uint256 coverageAmount,
        uint64 expiryAt
    );
    event PolicyExpired(uint256 indexed policyId);
    event PolicyCancelled(uint256 indexed policyId, string reason);
    event ClaimPaid(uint256 indexed policyId, uint256 indexed disputeId, address indexed holder, uint256 payout);
    event DisputeResolutionUpdated(address indexed disputeResolution);

    constructor(address disputeResolutionAddress) {
        require(disputeResolutionAddress != address(0), "TitleInsurance: invalid dispute contract");

        disputeResolution = IDisputeResolutionSummary(disputeResolutionAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(INSURER_ROLE, msg.sender);
        _grantRole(CLAIMS_ROLE, msg.sender);
    }

    modifier policyExists(uint256 policyId) {
        require(_policies[policyId].policyId != 0, "TitleInsurance: policy not found");
        _;
    }

    receive() external payable {
        reservePool += msg.value;
        emit ReserveFunded(msg.sender, msg.value);
    }

    function fundReserve() external payable onlyRole(INSURER_ROLE) whenNotPaused {
        require(msg.value > 0, "TitleInsurance: amount required");
        reservePool += msg.value;
        emit ReserveFunded(msg.sender, msg.value);
    }

    function issuePolicy(
        uint256 propertyId,
        address policyHolder,
        uint256 premium,
        uint256 coverageAmount,
        uint64 expiryAt,
        string calldata policyURI
    ) external onlyRole(INSURER_ROLE) whenNotPaused returns (uint256) {
        require(propertyId > 0, "TitleInsurance: property required");
        require(policyHolder != address(0), "TitleInsurance: invalid holder");
        require(coverageAmount > 0, "TitleInsurance: coverage required");
        require(expiryAt > block.timestamp, "TitleInsurance: invalid expiry");
        require(reservePool >= coverageAmount, "TitleInsurance: reserve too low");

        reservePool -= coverageAmount;

        _policyIdCounter++;
        uint256 policyId = _policyIdCounter;

        _policies[policyId] = Policy({
            policyId: policyId,
            propertyId: propertyId,
            policyHolder: policyHolder,
            insurer: msg.sender,
            premium: premium,
            coverageAmount: coverageAmount,
            lockedCoverage: coverageAmount,
            issuedAt: uint64(block.timestamp),
            expiryAt: expiryAt,
            status: PolicyStatus.Active,
            claimProcessedAt: 0,
            linkedDisputeId: 0,
            policyURI: policyURI
        });

        _propertyPolicies[propertyId].push(policyId);
        _holderPolicies[policyHolder].push(policyId);

        emit PolicyIssued(policyId, propertyId, policyHolder, msg.sender, coverageAmount, expiryAt);
        return policyId;
    }

    function expirePolicy(uint256 policyId) external policyExists(policyId) whenNotPaused {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "TitleInsurance: policy not active");
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(INSURER_ROLE, msg.sender) || hasRole(CLAIMS_ROLE, msg.sender),
            "TitleInsurance: not authorized"
        );
        require(
            block.timestamp >= policy.expiryAt || hasRole(ADMIN_ROLE, msg.sender),
            "TitleInsurance: policy not expired"
        );

        policy.status = PolicyStatus.Expired;
        reservePool += policy.lockedCoverage;
        policy.lockedCoverage = 0;

        emit PolicyExpired(policyId);
    }

    function cancelPolicy(uint256 policyId, string calldata reason)
        external
        policyExists(policyId)
        whenNotPaused
    {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "TitleInsurance: policy not active");
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == policy.insurer,
            "TitleInsurance: not authorized"
        );

        policy.status = PolicyStatus.Cancelled;
        reservePool += policy.lockedCoverage;
        policy.lockedCoverage = 0;

        emit PolicyCancelled(policyId, reason);
    }

    function payoutFromDispute(uint256 policyId, uint256 disputeId)
        external
        onlyRole(CLAIMS_ROLE)
        policyExists(policyId)
        whenNotPaused
    {
        Policy storage policy = _policies[policyId];
        require(policy.status == PolicyStatus.Active, "TitleInsurance: policy not active");
        require(policy.lockedCoverage > 0, "TitleInsurance: no locked coverage");

        (uint8 disputeStatus, uint8 disputeOutcome, uint256 disputePropertyId, , ) = disputeResolution.getDisputeSummary(
            disputeId
        );

        require(disputePropertyId == policy.propertyId, "TitleInsurance: dispute/property mismatch");
        require(disputeStatus == 2, "TitleInsurance: dispute not resolved");
        require(
            disputeOutcome == 3 || disputeOutcome == 4,
            "TitleInsurance: outcome not claimable"
        );

        uint256 payout = policy.lockedCoverage;
        policy.lockedCoverage = 0;
        policy.status = PolicyStatus.Claimed;
        policy.linkedDisputeId = disputeId;
        policy.claimProcessedAt = uint64(block.timestamp);

        (bool success, ) = payable(policy.policyHolder).call{value: payout}("");
        require(success, "TitleInsurance: payout failed");

        emit ClaimPaid(policyId, disputeId, policy.policyHolder, payout);
    }

    function setDisputeResolution(address disputeResolutionAddress) external onlyRole(ADMIN_ROLE) {
        require(disputeResolutionAddress != address(0), "TitleInsurance: invalid dispute contract");
        disputeResolution = IDisputeResolutionSummary(disputeResolutionAddress);
        emit DisputeResolutionUpdated(disputeResolutionAddress);
    }

    function getPolicy(uint256 policyId) external view policyExists(policyId) returns (Policy memory) {
        return _policies[policyId];
    }

    function getPropertyPolicies(uint256 propertyId) external view returns (uint256[] memory) {
        return _propertyPolicies[propertyId];
    }

    function getHolderPolicies(address holder) external view returns (uint256[] memory) {
        return _holderPolicies[holder];
    }

    function addInsurer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(INSURER_ROLE, account);
    }

    function removeInsurer(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(INSURER_ROLE, account);
    }

    function addClaimsOfficer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(CLAIMS_ROLE, account);
    }

    function removeClaimsOfficer(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(CLAIMS_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
