// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./LandRegistry.sol";
import "./interfaces/ITransfer.sol";

/**
 * @title Transfer
 * @dev Contract for handling property transfers with escrow functionality
 * @notice This contract manages the transfer process including escrow deposits and approvals
 * @author Jash Gudhka
 */
contract Transfer is ITransfer, AccessControl, ReentrancyGuard, Pausable {
    
    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // ============ State Variables ============
    LandRegistry public immutable registry;
    
    mapping(uint256 => TransferRequest) private _transfers;
    mapping(uint256 => uint256[]) private _propertyTransfers;
    mapping(address => uint256[]) private _userTransfers;
    
    uint256 private _transferIdCounter;
    uint256 public platformFeePercent = 1; // 1% platform fee
    address public feeCollector;

    // ============ Constructor ============
    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "Transfer: Invalid registry address");
        
        registry = LandRegistry(_registryAddress);
        feeCollector = msg.sender;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    // ============ Modifiers ============
    modifier transferExists(uint256 _transferId) {
        require(_transfers[_transferId].transferId != 0, "Transfer: Transfer does not exist");
        _;
    }

    modifier onlyBuyer(uint256 _transferId) {
        require(_transfers[_transferId].buyer == msg.sender, "Transfer: Not the buyer");
        _;
    }

    modifier onlySeller(uint256 _transferId) {
        require(_transfers[_transferId].seller == msg.sender, "Transfer: Not the seller");
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Initiate a property transfer request
     * @param _propertyId The ID of the property to purchase
     * @param _offeredPrice The price offered by the buyer
     * @return transferId The ID of the new transfer request
     */
    function initiateTransfer(uint256 _propertyId, uint256 _offeredPrice) 
        external 
        override 
        whenNotPaused 
        nonReentrant 
        returns (uint256) 
    {
        ILandRegistry.Property memory property = registry.getProperty(_propertyId);
        
        require(property.currentOwner != msg.sender, "Transfer: Cannot buy own property");
        require(
            property.status == ILandRegistry.PropertyStatus.Verified,
            "Transfer: Property not verified"
        );
        require(_offeredPrice > 0, "Transfer: Price must be greater than 0");

        _transferIdCounter++;
        uint256 transferId = _transferIdCounter;

        _transfers[transferId] = TransferRequest({
            transferId: transferId,
            propertyId: _propertyId,
            seller: property.currentOwner,
            buyer: msg.sender,
            agreedPrice: _offeredPrice,
            escrowAmount: 0,
            status: TransferStatus.Initiated,
            createdAt: block.timestamp,
            completedAt: 0
        });

        _propertyTransfers[_propertyId].push(transferId);
        _userTransfers[msg.sender].push(transferId);
        _userTransfers[property.currentOwner].push(transferId);

        emit TransferInitiated(transferId, _propertyId, msg.sender, _offeredPrice);
        return transferId;
    }

    /**
     * @notice Deposit escrow funds for a transfer
     * @param _transferId The ID of the transfer
     */
    function depositEscrow(uint256 _transferId) 
        external 
        payable 
        override 
        transferExists(_transferId) 
        onlyBuyer(_transferId) 
        whenNotPaused 
        nonReentrant 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(transfer.status == TransferStatus.Initiated, "Transfer: Invalid status for escrow");
        require(msg.value >= transfer.agreedPrice, "Transfer: Insufficient escrow amount");

        transfer.escrowAmount = msg.value;
        transfer.status = TransferStatus.EscrowFunded;

        emit EscrowDeposited(_transferId, msg.value);
    }

    /**
     * @notice Seller approves the transfer
     * @param _transferId The ID of the transfer
     */
    function approveTransferAsSeller(uint256 _transferId) 
        external 
        override 
        transferExists(_transferId) 
        onlySeller(_transferId) 
        whenNotPaused 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(
            transfer.status == TransferStatus.EscrowFunded,
            "Transfer: Escrow not funded"
        );

        transfer.status = TransferStatus.ApprovedBySeller;

        emit TransferApprovedBySeller(_transferId);
    }

    /**
     * @notice Registrar approves the transfer
     * @param _transferId The ID of the transfer
     */
    function approveTransferAsRegistrar(uint256 _transferId) 
        external 
        override 
        onlyRole(REGISTRAR_ROLE) 
        transferExists(_transferId) 
        whenNotPaused 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(
            transfer.status == TransferStatus.ApprovedBySeller,
            "Transfer: Seller approval required first"
        );

        transfer.status = TransferStatus.ApprovedByRegistrar;

        emit TransferApprovedByRegistrar(_transferId, msg.sender);
    }

    /**
     * @notice Complete the transfer and release escrow
     * @param _transferId The ID of the transfer
     */
    function completeTransfer(uint256 _transferId) 
        external 
        override 
        transferExists(_transferId) 
        whenNotPaused 
        nonReentrant 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(
            transfer.status == TransferStatus.ApprovedByRegistrar,
            "Transfer: Not approved by registrar"
        );
        require(
            msg.sender == transfer.buyer || 
            msg.sender == transfer.seller || 
            hasRole(REGISTRAR_ROLE, msg.sender),
            "Transfer: Not authorized"
        );

        // Calculate platform fee
        uint256 platformFee = (transfer.escrowAmount * platformFeePercent) / 100;
        uint256 sellerAmount = transfer.escrowAmount - platformFee;

        // Transfer ownership in registry
        registry.transferOwnership(transfer.propertyId, transfer.buyer);

        // Transfer funds to seller
        (bool sellerSuccess, ) = payable(transfer.seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Transfer: Failed to send funds to seller");

        // Transfer platform fee
        if (platformFee > 0) {
            (bool feeSuccess, ) = payable(feeCollector).call{value: platformFee}("");
            require(feeSuccess, "Transfer: Failed to send platform fee");
        }

        // Update transfer status
        transfer.status = TransferStatus.Completed;
        transfer.completedAt = block.timestamp;

        emit TransferCompleted(_transferId, transfer.seller, transfer.buyer);
    }

    /**
     * @notice Cancel a transfer and refund escrow
     * @param _transferId The ID of the transfer
     * @param _reason The reason for cancellation
     */
    function cancelTransfer(uint256 _transferId, string memory _reason) 
        external 
        override 
        transferExists(_transferId) 
        whenNotPaused 
        nonReentrant 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(
            transfer.status != TransferStatus.Completed &&
            transfer.status != TransferStatus.Cancelled,
            "Transfer: Cannot cancel"
        );
        require(
            msg.sender == transfer.buyer || 
            msg.sender == transfer.seller || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Transfer: Not authorized to cancel"
        );

        // Refund escrow if funded
        if (transfer.escrowAmount > 0) {
            uint256 refundAmount = transfer.escrowAmount;
            transfer.escrowAmount = 0;
            
            (bool success, ) = payable(transfer.buyer).call{value: refundAmount}("");
            require(success, "Transfer: Refund failed");
        }

        transfer.status = TransferStatus.Cancelled;

        emit TransferCancelled(_transferId, _reason);
    }

    /**
     * @notice Mark a transfer as disputed
     * @param _transferId The ID of the transfer
     * @param _reason The reason for the dispute
     */
    function disputeTransfer(uint256 _transferId, string memory _reason) 
        external 
        override 
        transferExists(_transferId) 
        whenNotPaused 
    {
        TransferRequest storage transfer = _transfers[_transferId];
        
        require(
            transfer.status != TransferStatus.Completed &&
            transfer.status != TransferStatus.Cancelled &&
            transfer.status != TransferStatus.Disputed,
            "Transfer: Cannot dispute"
        );
        require(
            msg.sender == transfer.buyer || 
            msg.sender == transfer.seller || 
            hasRole(REGISTRAR_ROLE, msg.sender),
            "Transfer: Not authorized to dispute"
        );

        transfer.status = TransferStatus.Disputed;

        emit TransferDisputed(_transferId, _reason);
    }

    // ============ View Functions ============

    /**
     * @notice Get transfer details
     * @param _transferId The ID of the transfer
     * @return TransferRequest struct with all details
     */
    function getTransfer(uint256 _transferId) 
        external 
        view 
        override 
        transferExists(_transferId) 
        returns (TransferRequest memory) 
    {
        return _transfers[_transferId];
    }

    /**
     * @notice Get all transfer IDs for a property
     * @param _propertyId The property ID
     * @return Array of transfer IDs
     */
    function getPropertyTransfers(uint256 _propertyId) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _propertyTransfers[_propertyId];
    }

    /**
     * @notice Get all transfer IDs for a user
     * @param _user The user address
     * @return Array of transfer IDs
     */
    function getUserTransfers(address _user) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _userTransfers[_user];
    }

    /**
     * @notice Get total number of transfers
     * @return Total transfer count
     */
    function getTotalTransfers() external view returns (uint256) {
        return _transferIdCounter;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the platform fee percentage
     * @param _feePercent New fee percentage (max 5%)
     */
    function setPlatformFee(uint256 _feePercent) external onlyRole(ADMIN_ROLE) {
        require(_feePercent <= 5, "Transfer: Fee too high");
        platformFeePercent = _feePercent;
    }

    /**
     * @notice Set the fee collector address
     * @param _feeCollector New fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyRole(ADMIN_ROLE) {
        require(_feeCollector != address(0), "Transfer: Invalid address");
        feeCollector = _feeCollector;
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Add a registrar
     * @param _account Address to add
     */
    function addRegistrar(address _account) external onlyRole(ADMIN_ROLE) {
        grantRole(REGISTRAR_ROLE, _account);
    }

    /**
     * @notice Remove a registrar
     * @param _account Address to remove
     */
    function removeRegistrar(address _account) external onlyRole(ADMIN_ROLE) {
        revokeRole(REGISTRAR_ROLE, _account);
    }

    // ============ Receive Function ============
    receive() external payable {
        revert("Transfer: Direct deposits not allowed");
    }
}
