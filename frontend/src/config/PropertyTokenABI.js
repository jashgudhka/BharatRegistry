export const PROPERTY_TOKEN_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "uint256", name: "totalShares", type: "uint256" },
      { internalType: "string", name: "tokenUri", type: "string" },
    ],
    name: "tokenizeProperty",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "propertyId", type: "uint256" }],
    name: "getTokenizedProperty",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "propertyId", type: "uint256" },
          { internalType: "uint256", name: "totalShares", type: "uint256" },
          { internalType: "address", name: "originalOwner", type: "address" },
          { internalType: "uint64", name: "tokenizedAt", type: "uint64" },
          { internalType: "string", name: "metadataURI", type: "string" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct PropertyToken.TokenizedProperty",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "address", name: "account", type: "address" },
    ],
    name: "balanceShares",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "propertyId", type: "uint256" },
    ],
    name: "sharePercentageBps",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
