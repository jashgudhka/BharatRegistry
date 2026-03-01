const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    // File info
    hash: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },

    // Ownership
    uploadedBy: {
      type: String, // wallet address
      required: true,
      lowercase: true,
    },

    // Property association
    propertyId: {
      type: Number,
    },

    // Document classification
    documentType: {
      type: String,
      enum: [
        "sale_deed",
        "agreement",
        "survey_map",
        "tax_receipt",
        "encumbrance",
        "mutation_order",
        "identity",
        "payment_proof",
        "inheritance",
        "power_of_attorney",
        "other",
      ],
      default: "other",
    },

    // Verification status
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      type: String, // admin/verifier wallet
      lowercase: true,
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    verificationNotes: {
      type: String,
    },

    // On-chain reference
    onChainTxHash: {
      type: String,
    },
    ipfsHash: {
      type: String, // The IPFS-style hash assigned after admin approval
    },

    // Description
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ propertyId: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ documentType: 1 });

module.exports = mongoose.model("Document", documentSchema);
