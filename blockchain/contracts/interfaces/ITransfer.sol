// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ITransfer
 * @dev Interface for the Transfer contract
 * @notice Defines the core functions for property transfers and escrow management
 */
interface ITransfer {
    
    // Enums
    enum TransferStatus {
        Initiated,
        EscrowFunded,
        ApprovedBySeller,
        ApprovedByRegistrar,
        Completed,
        Cancelled,
        Disputed
    }

    // Structs
    struct TransferRequest {
        uint256 transferId;
        uint256 propertyId;
        address seller;
        address buyer;
        uint256 agreedPrice;
        uint256 escrowAmount;
        TransferStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // Events
    event TransferInitiated(uint256 indexed transferId, uint256 indexed propertyId, address indexed buyer, uint256 price);
    event EscrowDeposited(uint256 indexed transferId, uint256 amount);
    event TransferApprovedBySeller(uint256 indexed transferId);
    event TransferApprovedByRegistrar(uint256 indexed transferId, address indexed registrar);
    event TransferCompleted(uint256 indexed transferId, address indexed from, address indexed to);
    event TransferCancelled(uint256 indexed transferId, string reason);
    event TransferDisputed(uint256 indexed transferId, string reason);

    // Functions
    function initiateTransfer(uint256 _propertyId, uint256 _offeredPrice) external returns (uint256);

    function depositEscrow(uint256 _transferId) external payable;

    function approveTransferAsSeller(uint256 _transferId) external;

    function approveTransferAsRegistrar(uint256 _transferId) external;

    function completeTransfer(uint256 _transferId) external;

    function cancelTransfer(uint256 _transferId, string memory _reason) external;

    function disputeTransfer(uint256 _transferId, string memory _reason) external;

    function getTransfer(uint256 _transferId) external view returns (TransferRequest memory);

    function getPropertyTransfers(uint256 _propertyId) external view returns (uint256[] memory);

    function getUserTransfers(address _user) external view returns (uint256[] memory);
}
