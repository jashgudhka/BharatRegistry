// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMortgageRegistry {
    function hasActiveEncumbrance(uint256 propertyId) external view returns (bool);
}
