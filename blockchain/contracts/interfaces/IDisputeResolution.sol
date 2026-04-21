// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDisputeResolution {
    function isPropertyBlocked(uint256 propertyId) external view returns (bool);

    function isTransferBlocked(uint256 transferId) external view returns (bool);
}
