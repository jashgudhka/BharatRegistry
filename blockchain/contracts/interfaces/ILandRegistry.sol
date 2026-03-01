// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ILandRegistry
 * @dev Interface for the Land Registry contract
 * @notice Defines the core functions for land registration and management
 */
interface ILandRegistry {
    
    // Enums
    enum PropertyStatus {
        Pending,
        Verified,
        Disputed,
        Transferred
    }

    // Structs
    struct Property {
        uint256 propertyId;
        string surveyNumber;
        string location;
        uint256 area;              // in square meters
        address currentOwner;
        uint256 marketValue;
        PropertyStatus status;
        uint256 registrationDate;
        string ipfsDocumentHash;
    }

    // Events
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner, string surveyNumber);
    event PropertyVerified(uint256 indexed propertyId, address indexed verifier);
    event PropertyTransferred(uint256 indexed propertyId, address indexed from, address indexed to);
    event PropertyDisputed(uint256 indexed propertyId, string reason);
    event PropertyUpdated(uint256 indexed propertyId, string ipfsDocumentHash);

    // Functions
    function registerProperty(
        string memory _surveyNumber,
        string memory _location,
        uint256 _area,
        uint256 _marketValue,
        string memory _ipfsHash
    ) external returns (uint256);

    function verifyProperty(uint256 _propertyId) external;

    function disputeProperty(uint256 _propertyId, string memory _reason) external;

    function getProperty(uint256 _propertyId) external view returns (Property memory);

    function getOwnerProperties(address _owner) external view returns (uint256[] memory);

    function getPropertyBySurveyNumber(string memory _surveyNumber) external view returns (Property memory);

    function isPropertyVerified(uint256 _propertyId) external view returns (bool);

    function getTotalProperties() external view returns (uint256);
}
