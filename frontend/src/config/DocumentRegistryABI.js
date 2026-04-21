export const DOCUMENT_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "contentHash", type: "bytes32" },
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "address", name: "subject", type: "address" },
      { internalType: "uint8", name: "documentType", type: "uint8" },
      { internalType: "string", name: "uri", type: "string" },
      { internalType: "string", name: "metadata", type: "string" },
    ],
    name: "registerDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }],
    name: "verifyDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "contentHash", type: "bytes32" }],
    name: "isDocumentAuthentic",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
