// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILandRegistry.sol";

/**
 * @title LandRegistry
 * @dev Main contract for Bharat Registry - Blockchain-Powered Land Registry System
 * @notice This contract manages property registration, verification, and ownership tracking
 * @author Jash Gudhka
 */
contract LandRegistry is ILandRegistry, AccessControl, ReentrancyGuard, Pausable {
    
    // ============ Roles ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // ============ State Variables ============
    mapping(uint256 => Property) private _properties;
    mapping(address => uint256[]) private _ownerProperties;
    mapping(string => uint256) private _surveyToPropertyId;
    
    uint256 private _propertyIdCounter;
    uint256 private _totalVerifiedProperties;

    // ============ Constructor ============
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ============ Modifiers ============
    modifier propertyExists(uint256 _propertyId) {
        require(_properties[_propertyId].propertyId != 0, "LandRegistry: Property does not exist");
        _;
    }

    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(_properties[_propertyId].currentOwner == msg.sender, "LandRegistry: Not the property owner");
        _;
    }

    // ============ External Functions ============

    /**
     * @notice Register a new property in the land registry
     * @param _surveyNumber Unique survey/plot number
     * @param _location Location description of the property
     * @param _area Area in square meters
     * @param _marketValue Current market value in wei
     * @param _ipfsHash IPFS hash of property documents
     * @return propertyId The ID of the newly registered property
     */
    function registerProperty(
        string memory _surveyNumber,
        string memory _location,
        uint256 _area,
        uint256 _marketValue,
        string memory _ipfsHash
    ) external override whenNotPaused nonReentrant returns (uint256) {
        require(bytes(_surveyNumber).length > 0, "LandRegistry: Survey number required");
        require(bytes(_location).length > 0, "LandRegistry: Location required");
        require(_area > 0, "LandRegistry: Area must be greater than 0");
        require(_surveyToPropertyId[_surveyNumber] == 0, "LandRegistry: Property already registered");

        _propertyIdCounter++;
        uint256 newPropertyId = _propertyIdCounter;

        _properties[newPropertyId] = Property({
            propertyId: newPropertyId,
            surveyNumber: _surveyNumber,
            location: _location,
            area: _area,
            currentOwner: msg.sender,
            marketValue: _marketValue,
            status: PropertyStatus.Pending,
            registrationDate: block.timestamp,
            ipfsDocumentHash: _ipfsHash
        });

        _surveyToPropertyId[_surveyNumber] = newPropertyId;
        _ownerProperties[msg.sender].push(newPropertyId);

        emit PropertyRegistered(newPropertyId, msg.sender, _surveyNumber);
        return newPropertyId;
    }

    /**
     * @notice Verify a property (government official only)
     * @param _propertyId The ID of the property to verify
     */
    function verifyProperty(uint256 _propertyId) 
        external 
        override 
        onlyRole(VERIFIER_ROLE) 
        propertyExists(_propertyId) 
        whenNotPaused 
    {
        require(
            _properties[_propertyId].status == PropertyStatus.Pending, 
            "LandRegistry: Property not in pending status"
        );

        _properties[_propertyId].status = PropertyStatus.Verified;
        _totalVerifiedProperties++;

        emit PropertyVerified(_propertyId, msg.sender);
    }

    /**
     * @notice Mark a property as disputed
     * @param _propertyId The ID of the property to dispute
     * @param _reason The reason for the dispute
     */
    function disputeProperty(uint256 _propertyId, string memory _reason) 
        external 
        override 
        onlyRole(REGISTRAR_ROLE) 
        propertyExists(_propertyId) 
        whenNotPaused 
    {
        require(
            _properties[_propertyId].status != PropertyStatus.Disputed, 
            "LandRegistry: Property already disputed"
        );

        if (_properties[_propertyId].status == PropertyStatus.Verified) {
            _totalVerifiedProperties--;
        }

        _properties[_propertyId].status = PropertyStatus.Disputed;

        emit PropertyDisputed(_propertyId, _reason);
    }

    /**
     * @notice Transfer property ownership (internal function called by Transfer contract)
     * @param _propertyId The ID of the property
     * @param _newOwner The address of the new owner
     */
    function transferOwnership(uint256 _propertyId, address _newOwner) 
        external 
        onlyRole(REGISTRAR_ROLE) 
        propertyExists(_propertyId) 
        whenNotPaused 
    {
        require(_newOwner != address(0), "LandRegistry: Invalid new owner address");
        require(
            _properties[_propertyId].status == PropertyStatus.Verified,
            "LandRegistry: Property must be verified"
        );

        address previousOwner = _properties[_propertyId].currentOwner;
        
        // Remove property from previous owner's list
        _removePropertyFromOwner(previousOwner, _propertyId);
        
        // Add property to new owner's list
        _ownerProperties[_newOwner].push(_propertyId);
        
        // Update property owner
        _properties[_propertyId].currentOwner = _newOwner;
        _properties[_propertyId].status = PropertyStatus.Transferred;

        emit PropertyTransferred(_propertyId, previousOwner, _newOwner);
    }

    /**
     * @notice Update property documents (owner only)
     * @param _propertyId The ID of the property
     * @param _newIpfsHash New IPFS hash for updated documents
     */
    function updatePropertyDocuments(uint256 _propertyId, string memory _newIpfsHash) 
        external 
        propertyExists(_propertyId) 
        onlyPropertyOwner(_propertyId) 
        whenNotPaused 
    {
        require(bytes(_newIpfsHash).length > 0, "LandRegistry: IPFS hash required");
        
        _properties[_propertyId].ipfsDocumentHash = _newIpfsHash;

        emit PropertyUpdated(_propertyId, _newIpfsHash);
    }

    /**
     * @notice Update property market value (owner only)
     * @param _propertyId The ID of the property
     * @param _newMarketValue New market value in wei
     */
    function updateMarketValue(uint256 _propertyId, uint256 _newMarketValue) 
        external 
        propertyExists(_propertyId) 
        onlyPropertyOwner(_propertyId) 
        whenNotPaused 
    {
        _properties[_propertyId].marketValue = _newMarketValue;
    }

    // ============ View Functions ============

    /**
     * @notice Get property details by ID
     * @param _propertyId The ID of the property
     * @return Property struct with all details
     */
    function getProperty(uint256 _propertyId) 
        external 
        view 
        override 
        propertyExists(_propertyId) 
        returns (Property memory) 
    {
        return _properties[_propertyId];
    }

    /**
     * @notice Get all property IDs owned by an address
     * @param _owner The owner's address
     * @return Array of property IDs
     */
    function getOwnerProperties(address _owner) 
        external 
        view 
        override 
        returns (uint256[] memory) 
    {
        return _ownerProperties[_owner];
    }

    /**
     * @notice Get property by survey number
     * @param _surveyNumber The survey number to look up
     * @return Property struct with all details
     */
    function getPropertyBySurveyNumber(string memory _surveyNumber) 
        external 
        view 
        override 
        returns (Property memory) 
    {
        uint256 propertyId = _surveyToPropertyId[_surveyNumber];
        require(propertyId != 0, "LandRegistry: Property not found");
        return _properties[propertyId];
    }

    /**
     * @notice Check if a property is verified
     * @param _propertyId The ID of the property
     * @return True if property is verified
     */
    function isPropertyVerified(uint256 _propertyId) 
        external 
        view 
        override 
        propertyExists(_propertyId) 
        returns (bool) 
    {
        return _properties[_propertyId].status == PropertyStatus.Verified;
    }

    /**
     * @notice Get total number of registered properties
     * @return Total property count
     */
    function getTotalProperties() external view override returns (uint256) {
        return _propertyIdCounter;
    }

    /**
     * @notice Get total number of verified properties
     * @return Verified property count
     */
    function getTotalVerifiedProperties() external view returns (uint256) {
        return _totalVerifiedProperties;
    }

    /**
     * @notice Get property ID by survey number
     * @param _surveyNumber The survey number
     * @return Property ID (0 if not found)
     */
    function getPropertyIdBySurveyNumber(string memory _surveyNumber) 
        external 
        view 
        returns (uint256) 
    {
        return _surveyToPropertyId[_surveyNumber];
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Grant verifier role to an address
     * @param _account The address to grant the role to
     */
    function addVerifier(address _account) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, _account);
    }

    /**
     * @notice Revoke verifier role from an address
     * @param _account The address to revoke the role from
     */
    function removeVerifier(address _account) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, _account);
    }

    /**
     * @notice Grant registrar role to an address
     * @param _account The address to grant the role to
     */
    function addRegistrar(address _account) external onlyRole(ADMIN_ROLE) {
        grantRole(REGISTRAR_ROLE, _account);
    }

    /**
     * @notice Revoke registrar role from an address
     * @param _account The address to revoke the role from
     */
    function removeRegistrar(address _account) external onlyRole(ADMIN_ROLE) {
        revokeRole(REGISTRAR_ROLE, _account);
    }

    // ============ Internal Functions ============

    /**
     * @dev Remove a property from an owner's list
     * @param _owner The owner's address
     * @param _propertyId The property ID to remove
     */
    function _removePropertyFromOwner(address _owner, uint256 _propertyId) internal {
        uint256[] storage ownerProps = _ownerProperties[_owner];
        for (uint256 i = 0; i < ownerProps.length; i++) {
            if (ownerProps[i] == _propertyId) {
                ownerProps[i] = ownerProps[ownerProps.length - 1];
                ownerProps.pop();
                break;
            }
        }
    }
}
