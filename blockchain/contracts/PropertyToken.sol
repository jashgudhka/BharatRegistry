// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILandRegistry.sol";

/**
 * @title PropertyToken
 * @notice ERC1155 fractional tokenization of verified properties.
 */
contract PropertyToken is ERC1155, AccessControl, Pausable, ReentrancyGuard, ERC1155Holder {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOKENIZER_ROLE = keccak256("TOKENIZER_ROLE");
    bytes32 public constant LEASE_MANAGER_ROLE = keccak256("LEASE_MANAGER_ROLE");

    ILandRegistry public immutable landRegistry;

    struct TokenizedProperty {
        uint256 propertyId;
        uint256 totalShares;
        address originalOwner;
        uint64 tokenizedAt;
        string metadataURI;
        bool active;
    }

    struct SaleListing {
        uint256 listingId;
        uint256 propertyId;
        address seller;
        uint256 shares;
        uint256 pricePerShare;
        uint64 createdAt;
        bool active;
    }

    struct LeaseAgreement {
        uint256 leaseId;
        uint256 propertyId;
        address lessor;
        address tenant;
        uint256 shares;
        uint256 rentPerShare;
        uint64 startAt;
        uint64 endAt;
        bool active;
        bool fullProperty;
        uint256 paidAmount;
        string metadataURI;
    }

    mapping(uint256 => TokenizedProperty) private _tokenizedProperties;
    mapping(uint256 => string) private _tokenUris;
    mapping(uint256 => SaleListing) private _saleListings;
    mapping(uint256 => uint256[]) private _propertySaleListings;
    mapping(uint256 => LeaseAgreement) private _leases;
    mapping(uint256 => uint256[]) private _propertyLeases;
    mapping(uint256 => mapping(address => uint256)) private _leaseIncomeClaimed;
    mapping(uint256 => mapping(address => uint256)) private _lockedShares;

    uint256 private _saleListingCounter;
    uint256 private _leaseCounter;

    event PropertyTokenized(
        uint256 indexed propertyId,
        address indexed owner,
        uint256 totalShares,
        string tokenURI
    );
    event TokenUriUpdated(uint256 indexed propertyId, string tokenURI);
    event SaleListingCreated(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed seller,
        uint256 shares,
        uint256 pricePerShare
    );
    event SaleListingCancelled(uint256 indexed listingId);
    event FractionPurchased(
        uint256 indexed listingId,
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 shares,
        uint256 totalPrice
    );
    event LeaseCreated(
        uint256 indexed leaseId,
        uint256 indexed propertyId,
        address indexed lessor,
        address tenant,
        uint256 shares,
        uint256 rentPerShare,
        bool fullProperty
    );
    event LeaseCancelled(uint256 indexed leaseId);
    event RentPaid(uint256 indexed leaseId, address indexed payer, uint256 amount);
    event RentClaimed(uint256 indexed leaseId, address indexed owner, uint256 amount);

    constructor(address landRegistryAddress, string memory baseUri) ERC1155(baseUri) {
        require(landRegistryAddress != address(0), "PropertyToken: invalid registry address");

        landRegistry = ILandRegistry(landRegistryAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TOKENIZER_ROLE, msg.sender);
        _grantRole(LEASE_MANAGER_ROLE, msg.sender);
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
        require(
            msg.sender == tokenized.originalOwner || hasRole(ADMIN_ROLE, msg.sender),
            "PropertyToken: not authorized"
        );

        _burn(msg.sender, propertyId, amount);
        tokenized.totalShares -= amount;

        if (tokenized.totalShares == 0) {
            tokenized.active = false;
        }
    }

    function createSaleListing(
        uint256 propertyId,
        uint256 shares,
        uint256 pricePerShare
    ) external whenNotPaused returns (uint256) {
        require(shares > 0, "PropertyToken: shares required");
        require(pricePerShare > 0, "PropertyToken: price required");

        TokenizedProperty storage tokenized = _tokenizedProperties[propertyId];
        require(tokenized.active, "PropertyToken: not tokenized");
        uint256 available = balanceOf(msg.sender, propertyId) - _lockedShares[propertyId][msg.sender];
        require(available >= shares, "PropertyToken: insufficient available shares");
        require(isApprovedForAll(msg.sender, address(this)), "PropertyToken: approve contract first");

        _saleListingCounter++;
        uint256 listingId = _saleListingCounter;

        _saleListings[listingId] = SaleListing({
            listingId: listingId,
            propertyId: propertyId,
            seller: msg.sender,
            shares: shares,
            pricePerShare: pricePerShare,
            createdAt: uint64(block.timestamp),
            active: true
        });

        _propertySaleListings[propertyId].push(listingId);
        safeTransferFrom(msg.sender, address(this), propertyId, shares, "");

        emit SaleListingCreated(listingId, propertyId, msg.sender, shares, pricePerShare);
        return listingId;
    }

    function cancelSaleListing(uint256 listingId) external whenNotPaused {
        SaleListing storage listing = _saleListings[listingId];
        require(listing.active, "PropertyToken: listing not active");
        require(msg.sender == listing.seller, "PropertyToken: only seller can cancel");

        listing.active = false;
        _safeTransferFrom(address(this), listing.seller, listing.propertyId, listing.shares, "");

        emit SaleListingCancelled(listingId);
    }

    function purchaseFraction(uint256 listingId) external payable nonReentrant whenNotPaused {
        SaleListing storage listing = _saleListings[listingId];
        require(listing.active, "PropertyToken: listing not active");

        uint256 totalPrice = listing.shares * listing.pricePerShare;
        require(msg.value == totalPrice, "PropertyToken: incorrect payment amount");

        listing.active = false;
        _safeTransferFrom(address(this), msg.sender, listing.propertyId, listing.shares, "");

        (bool success, ) = payable(listing.seller).call{value: msg.value}("");
        require(success, "PropertyToken: payment transfer failed");

        emit FractionPurchased(listingId, listing.propertyId, msg.sender, listing.shares, totalPrice);
    }

    function getSaleListing(uint256 listingId) external view returns (SaleListing memory) {
        return _saleListings[listingId];
    }

    function getPropertySaleListings(uint256 propertyId) external view returns (SaleListing[] memory) {
        uint256[] storage listingIds = _propertySaleListings[propertyId];
        SaleListing[] memory listings = new SaleListing[](listingIds.length);
        for (uint256 i = 0; i < listingIds.length; i++) {
            listings[i] = _saleListings[listingIds[i]];
        }
        return listings;
    }

    function createLease(
        uint256 propertyId,
        address tenant,
        uint256 shares,
        uint256 rentPerShare,
        uint64 startAt,
        uint64 endAt,
        bool fullProperty,
        string calldata metadataURI
    ) external whenNotPaused returns (uint256) {
        require(tenant != address(0), "PropertyToken: tenant required");
        require(tenant != msg.sender, "PropertyToken: lessor cannot be tenant");
        require(shares > 0, "PropertyToken: shares required");
        require(rentPerShare > 0, "PropertyToken: rent required");
        require(startAt < endAt, "PropertyToken: invalid lease period");

        TokenizedProperty storage tokenized = _tokenizedProperties[propertyId];
        require(tokenized.active, "PropertyToken: not tokenized");

        uint256 available = balanceOf(msg.sender, propertyId) - _lockedShares[propertyId][msg.sender];
        require(available >= shares, "PropertyToken: insufficient available shares");

        if (fullProperty) {
            require(balanceOf(msg.sender, propertyId) == tokenized.totalShares, "PropertyToken: must own all shares to lease full property");
            require(shares == tokenized.totalShares, "PropertyToken: shares must equal total shares for full property");
        }

        _leaseCounter++;
        uint256 leaseId = _leaseCounter;

        _leases[leaseId] = LeaseAgreement({
            leaseId: leaseId,
            propertyId: propertyId,
            lessor: msg.sender,
            tenant: tenant,
            shares: shares,
            rentPerShare: rentPerShare,
            startAt: startAt,
            endAt: endAt,
            active: true,
            fullProperty: fullProperty,
            paidAmount: 0,
            metadataURI: metadataURI
        });

        _propertyLeases[propertyId].push(leaseId);
        _lockedShares[propertyId][msg.sender] += shares;

        emit LeaseCreated(leaseId, propertyId, msg.sender, tenant, shares, rentPerShare, fullProperty);
        return leaseId;
    }

    function cancelLease(uint256 leaseId) external whenNotPaused {
        LeaseAgreement storage lease = _leases[leaseId];
        require(lease.active, "PropertyToken: lease not active");
        require(
            msg.sender == lease.lessor ||
            hasRole(ADMIN_ROLE, msg.sender) ||
            hasRole(LEASE_MANAGER_ROLE, msg.sender),
            "PropertyToken: not authorized"
        );

        lease.active = false;
        _lockedShares[lease.propertyId][lease.lessor] -= lease.shares;

        emit LeaseCancelled(leaseId);
    }

    function payRent(uint256 leaseId) external payable nonReentrant whenNotPaused {
        LeaseAgreement storage lease = _leases[leaseId];
        require(lease.active, "PropertyToken: lease not active");
        require(msg.sender == lease.tenant, "PropertyToken: not tenant");
        require(block.timestamp >= lease.startAt, "PropertyToken: lease not started");
        require(block.timestamp <= lease.endAt, "PropertyToken: lease ended");

        uint256 requiredAmount = lease.shares * lease.rentPerShare;
        require(msg.value == requiredAmount, "PropertyToken: incorrect rent amount");

        lease.paidAmount += msg.value;

        if (!lease.fullProperty) {
            (bool success, ) = payable(lease.lessor).call{value: msg.value}("");
            require(success, "PropertyToken: rent transfer failed");
        }

        emit RentPaid(leaseId, msg.sender, msg.value);
    }

    function claimRent(uint256 leaseId) external nonReentrant whenNotPaused {
        LeaseAgreement storage lease = _leases[leaseId];
        require(lease.active || lease.paidAmount > 0, "PropertyToken: lease not eligible");
        require(lease.fullProperty, "PropertyToken: not a full property lease");

        TokenizedProperty storage tokenized = _tokenizedProperties[lease.propertyId];
        require(tokenized.totalShares > 0, "PropertyToken: invalid total shares");

        uint256 ownerShares = balanceOf(msg.sender, lease.propertyId);
        require(ownerShares > 0, "PropertyToken: no share ownership");

        uint256 entitled = (lease.paidAmount * ownerShares) / tokenized.totalShares;
        uint256 alreadyClaimed = _leaseIncomeClaimed[leaseId][msg.sender];
        require(entitled > alreadyClaimed, "PropertyToken: nothing to claim");

        uint256 claimAmount = entitled - alreadyClaimed;
        _leaseIncomeClaimed[leaseId][msg.sender] = entitled;

        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        require(success, "PropertyToken: claim transfer failed");

        emit RentClaimed(leaseId, msg.sender, claimAmount);
    }

    function getLease(uint256 leaseId) external view returns (LeaseAgreement memory) {
        return _leases[leaseId];
    }

    function getPropertyLeases(uint256 propertyId) external view returns (LeaseAgreement[] memory) {
        uint256[] storage leaseIds = _propertyLeases[propertyId];
        LeaseAgreement[] memory leases = new LeaseAgreement[](leaseIds.length);
        for (uint256 i = 0; i < leaseIds.length; i++) {
            leases[i] = _leases[leaseIds[i]];
        }
        return leases;
    }

    function balanceShares(uint256 propertyId, address account) external view returns (uint256) {
        return balanceOf(account, propertyId);
    }

    function availableShares(uint256 propertyId, address account) external view returns (uint256) {
        return balanceOf(account, propertyId) - _lockedShares[propertyId][account];
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

    function addLeaseManager(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(LEASE_MANAGER_ROLE, account);
    }

    function removeLeaseManager(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(LEASE_MANAGER_ROLE, account);
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
        if (from != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 available = balanceOf(from, ids[i]) - _lockedShares[ids[i]][from];
                require(available >= values[i], "PropertyToken: shares are locked");
            }
        }

        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl, ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
