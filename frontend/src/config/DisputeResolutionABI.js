export const DISPUTE_RESOLUTION_ABI = [
  {
    inputs: [
      { internalType: "uint8", name: "disputeType", type: "uint8" },
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "uint256", name: "transferId", type: "uint256" },
      { internalType: "address", name: "respondent", type: "address" },
      { internalType: "bool", name: "blockProperty", type: "bool" },
      { internalType: "bool", name: "blockTransfer", type: "bool" },
      { internalType: "string", name: "evidenceURI", type: "string" },
    ],
    name: "openDispute",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "disputeId", type: "uint256" }],
    name: "moveToReview",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "disputeId", type: "uint256" },
      { internalType: "uint8", name: "outcome", type: "uint8" },
      { internalType: "bool", name: "keepBlocks", type: "bool" },
      { internalType: "string", name: "resolutionURI", type: "string" },
    ],
    name: "resolveDispute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "propertyId", type: "uint256" }],
    name: "isPropertyBlocked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
