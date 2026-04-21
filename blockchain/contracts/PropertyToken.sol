// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILandRegistry.sol";

/**
 * @title PropertyToken
 * @notice ERC1155 fractional tokenization of verified properties.
 */
contract PropertyToken is ERC1155, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOKENIZER_ROLE = keccak256("TOKENIZER_ROLE");

    ILandRegistry public immutable landRegistry;

    struct TokenizedProperty {
        uint256 propertyId;
        uint256 totalShares;
        address originalOwner;
        uint64 tokenizedAt;
        string metadataURI;
        bool active;
    }

    mapping(uint256 => TokenizedProperty) private _tokenizedProperties;
    mapping(uint256 => string) private _tokenUris;

    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 totalShares,
        string tokenURI
    );
    event TokenUriUpdated(uint256 indexed propertyId, string tokenURI);

    constructor(address landRegistryAddress, string memory baseUri) ERC1155(baseUri) {
        require(landRegistryAddress != address(0), "PropertyToken: invalid registry address");

        landRegistry = ILandRegistry(landRegistryAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TOKENIZER_ROLE, msg.sender);
    }

    function tokenizeProperty(uint256 propertyId, uint256 totalShares, string calldata tokenUri)
        external
        onlyRole(TOKENIZER_ROLE)
        whenNotPaused
        returns (uint256)
    {
        require(propertyId > 0, "PropertyToken: property required");
        require(totalShares > 0, "PropertyToken: shares required");
        require(!_tokenizedProperties[propertyId].active, "PropertyToken: already tokenized");

        ILandRegistry.Property memory property = landRegistry.getProperty(propertyId);
        require(property.currentOwner == msg.sender, "PropertyToken: not owner");
        require(property.status == ILandRegistry.PropertyStatus.Verified, "PropertyToken: property not verified");

        _tokenizedProperties[propertyId] = TokenizedProperty({
            propertyId: propertyId,
            totalShares: totalShares,
            originalOwner: msg.sender,
            tokenizedAt: uint64(block.timestamp),
            metadataURI: tokenUri,
            active: true
        });

        _tokenUris[propertyId] = tokenUri;
        _mint(msg.sender, propertyId, totalShares, "");

        emit PropertyTokenized(propertyId, msg.sender, totalShares, tokenUri);
        return propertyId;
    }

    function setTokenURI(uint256 propertyId, string calldata tokenUri) external {
        TokenizedProperty storage tokenized = _tokenizedProperties[propertyId];
        require(tokenized.active, "PropertyToken: not tokenized");
        require(
            msg.sender == tokenized.originalOwner || hasRole(ADMIN_ROLE, msg.sender),
            "PropertyToken: not authorized"
        );

        tokenized.metadataURI = tokenUri;
        _tokenUris[propertyId] = tokenUri;

        emit TokenUriUpdated(propertyId, tokenUri);
    }

    function burnShares(uint256 propertyId, uint256 amount) external whenNotPaused {
        require(amount > 0, "PropertyToken: amount required");

        TokenizedProperty storage tokenized = _tokenizedProperties[propertyId];
        require(tokenized.active, "PropertyToken: not active");

        _burn(msg.sender, propertyId, amount);
        tokenized.totalShares -= amount;

        if (tokenized.totalShares == 0) {
            tokenized.active = false;
        }
    }

    function balanceShares(uint256 propertyId, address account) external view returns (uint256) {
        return balanceOf(account, propertyId);
    }

    function sharePercentageBps(address account, uint256 propertyId) external view returns (uint256) {
        TokenizedProperty storage tokenized = _tokenizedProperties[propertyId];
        if (tokenized.totalShares == 0) {
            return 0;
        }

        return (balanceOf(account, propertyId) * 10_000) / tokenized.totalShares;
    }

    function getTokenizedProperty(uint256 propertyId) external view returns (TokenizedProperty memory) {
        return _tokenizedProperties[propertyId];
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory customUri = _tokenUris[tokenId];
        if (bytes(customUri).length > 0) {
            return customUri;
        }

        return super.uri(tokenId);
    }

    function addTokenizer(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(TOKENIZER_ROLE, account);
    }

    function removeTokenizer(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(TOKENIZER_ROLE, account);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
