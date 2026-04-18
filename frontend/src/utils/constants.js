// Contract addresses from deployment
export const LAND_REGISTRY_ADDRESS =
  import.meta.env.VITE_LAND_REGISTRY_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const TRANSFER_ADDRESS =
  import.meta.env.VITE_TRANSFER_ADDRESS ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// API URL
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Property status mapping
export const PROPERTY_STATUS = {
  0: "pending",
  1: "verified",
  2: "disputed",
  3: "transferred",
};

export const PROPERTY_STATUS_LABELS = {
  pending: "Pending Verification",
  verified: "Verified",
  disputed: "Disputed",
  transferred: "Transferred",
};

// Transfer status mapping
export const TRANSFER_STATUS = {
  0: "initiated",
  1: "escrow_funded",
  2: "approved_by_seller",
  3: "approved_by_registrar",
  4: "completed",
  5: "cancelled",
  6: "disputed",
};

export const LEGACY_TRANSFER_STATUS_ALIASES = {
  pending: "initiated",
  deposited: "escrow_funded",
  seller_approved: "approved_by_seller",
  government_approved: "approved_by_registrar",
};

export const normalizeTransferStatus = (status) => {
  return LEGACY_TRANSFER_STATUS_ALIASES[status] || status;
};

export const TRANSFER_STATUS_LABELS = {
  initiated: "Initiated",
  escrow_funded: "Escrow Funded",
  approved_by_seller: "Seller Approved",
  approved_by_registrar: "Registrar Approved",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",

  // Backward compatibility for already persisted legacy values.
  pending: "Initiated",
  deposited: "Escrow Funded",
  seller_approved: "Seller Approved",
  government_approved: "Registrar Approved",
};

// Helper functions
export const getStatusFromNumber = (statusNum, type = "property") => {
  if (type === "property") {
    return PROPERTY_STATUS[statusNum] || "pending";
  } else {
    return TRANSFER_STATUS[statusNum] || "initiated";
  }
};

export const truncateAddress = (address, chars = 4) => {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Property types
export const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed", label: "Mixed Use" },
];

// Indian states for location dropdown
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
];
