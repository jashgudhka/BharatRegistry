export const MORTGAGE_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "address", name: "borrower", type: "address" },
      { internalType: "uint256", name: "principal", type: "uint256" },
      { internalType: "uint64", name: "dueDate", type: "uint64" },
      { internalType: "string", name: "referenceId", type: "string" },
    ],
    name: "createLien",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "lienId", type: "uint256" },
      { internalType: "uint256", name: "outstanding", type: "uint256" },
    ],
    name: "updateOutstanding",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "propertyId", type: "uint256" }],
    name: "hasActiveEncumbrance",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
