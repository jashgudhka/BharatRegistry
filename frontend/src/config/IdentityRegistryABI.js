export const IDENTITY_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "string", name: "identityHash", type: "string" },
      { internalType: "string", name: "metadataURI", type: "string" },
    ],
    name: "submitIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "bool", name: "approved", type: "bool" },
      { internalType: "string", name: "notes", type: "string" },
    ],
    name: "reviewIdentity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint8", name: "roleId", type: "uint8" },
    ],
    name: "grantAccreditedRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "hasActiveKyc",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint8", name: "roleId", type: "uint8" },
    ],
    name: "hasAccreditedRole",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];
