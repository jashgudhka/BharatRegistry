// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILandRegistry.sol";

/**
 * @title MortgageRegistry
 * @notice Tracks mortgages/liens and exposes encumbrance checks for transfer control.
 */
contract MortgageRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    ILandRegistry public immutable landRegistry;

    struct Lien {
        uint256 lienId;
        uint256 propertyId;
        address lender;
        address borrower;
        uint256 principal;
        uint256 outstanding;
        uint64 createdAt;
        uint64 dueDate;
        bool active;
        string referenceId;
    }

    uint256 private _lienIdCounter;

    mapping(uint256 => Lien) private _liens;
    mapping(uint256 => uint256[]) private _propertyLiens;
    mapping(address => uint256[]) private _borrowerLiens;
    mapping(address => uint256[]) private _lenderLiens;

    event LienCreated(
        uint256 indexed lienId,
        uint256 indexed propertyId,
        address indexed lender,
        address borrower,
        uint256 principal,
        uint64 dueDate
    );
    event LienOutstandingUpdated(uint256 indexed lienId, uint256 outstanding, address indexed updatedBy);
    event LienClosed(uint256 indexed lienId, address indexed closedBy, string reason);

    constructor(address landRegistryAddress) {
        require(landRegistryAddress != address(0), "MortgageRegistry: invalid registry address");

        landRegistry = ILandRegistry(landRegistryAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(BANK_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    modifier lienExists(uint256 lienId) {
        require(_liens[lienId].lienId != 0, "MortgageRegistry: lien not found");
        _;
    }

    modifier onlyBankOrLender(uint256 lienId) {
        require(
            hasRole(BANK_ROLE, msg.sender) || _liens[lienId].lender == msg.sender,
            "MortgageRegistry: not bank/lender"
        );
        _;
    }

    function createLien(
        uint256 propertyId,
        address borrower,
        uint256 principal,
        uint64 dueDate,
        string calldata referenceId
    ) external onlyRole(BANK_ROLE) whenNotPaused returns (uint256) {
        require(borrower != address(0), "MortgageRegistry: invalid borrower");
        require(principal > 0, "MortgageRegistry: principal required");
        require(dueDate > block.timestamp, "MortgageRegistry: due date must be in future");

        ILandRegistry.Property memory property = landRegistry.getProperty(propertyId);
        require(property.currentOwner == borrower, "MortgageRegistry: borrower must own property");

        _lienIdCounter++;
        uint256 newLienId = _lienIdCounter;

        _liens[newLienId] = Lien({
            lienId: newLienId,
            propertyId: propertyId,
            lender: msg.sender,
            borrower: borrower,
            principal: principal,
            outstanding: principal,
            createdAt: uint64(block.timestamp),
            dueDate: dueDate,
            active: true,
            referenceId: referenceId
        });

        _propertyLiens[propertyId].push(newLienId);
        _borrowerLiens[borrower].push(newLienId);
        _lenderLiens[msg.sender].push(newLienId);

        emit LienCreated(newLienId, propertyId, msg.sender, borrower, principal, dueDate);
        return newLienId;
    }

    function updateOutstanding(uint256 lienId, uint256 outstanding)
        external
        lienExists(lienId)
        onlyBankOrLender(lienId)
        whenNotPaused
    {
        Lien storage lien = _liens[lienId];
        require(lien.active, "MortgageRegistry: lien inactive");

        lien.outstanding = outstanding;
        emit LienOutstandingUpdated(lienId, outstanding, msg.sender);

        if (outstanding == 0) {
            lien.active = false;
            emit LienClosed(lienId, msg.sender, "settled");
        }
    }

    function closeLien(uint256 lienId, string calldata reason)
        external
        lienExists(lienId)
        whenNotPaused
    {
        Lien storage lien = _liens[lienId];
        require(lien.active, "MortgageRegistry: already closed");
        require(
            hasRole(REGISTRAR_ROLE, msg.sender) ||
                hasRole(BANK_ROLE, msg.sender) ||
                lien.lender == msg.sender,
            "MortgageRegistry: not authorized"
        );

        lien.active = false;
        lien.outstanding = 0;

        emit LienClosed(lienId, msg.sender, reason);
    }

    function hasActiveEncumbrance(uint256 propertyId) external view returns (bool) {
        uint256[] storage lienIds = _propertyLiens[propertyId];
        for (uint256 i = 0; i < lienIds.length; i++) {
            Lien storage lien = _liens[lienIds[i]];
            if (lien.active && lien.outstanding > 0) {
                return true;
            }
        }

        return false;
    }

    function getLien(uint256 lienId) external view lienExists(lienId) returns (Lien memory) {
        return _liens[lienId];
    }

    function getPropertyLiens(uint256 propertyId) external view returns (uint256[] memory) {
        return _propertyLiens[propertyId];
    }

    function getBorrowerLiens(address borrower) external view returns (uint256[] memory) {
        return _borrowerLiens[borrower];
    }

    function getLenderLiens(address lender) external view returns (uint256[] memory) {
        return _lenderLiens[lender];
    }

    function addBank(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(BANK_ROLE, account);
    }

    function removeBank(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(BANK_ROLE, account);
    }

    function addRegistrar(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(REGISTRAR_ROLE, account);
    }

    function removeRegistrar(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(REGISTRAR_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}