const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: Number,
      required: true,
      unique: true,
    },
    surveyNumber: {
      type: String,
      required: true,
      unique: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    area: {
      type: Number, // in square meters
      required: true,
    },
    propertyType: {
      type: String,
      enum: [
        "residential",
        "commercial",
        "agricultural",
        "industrial",
        "mixed",
      ],
      default: "residential",
    },
    currentOwner: {
      type: String, // Wallet address
      required: true,
      lowercase: true,
    },
    marketValue: {
      type: String, // Stored as string for large numbers (wei)
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "disputed", "transferred"],
      default: "pending",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    documents: [
      {
        name: String,
        ipfsHash: String,
        documentType: {
          type: String,
          enum: ["deed", "map", "tax_receipt", "encumbrance", "other"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    previousOwners: [
      {
        walletAddress: String,
        transferDate: Date,
        transferPrice: String,
        transactionHash: String,
      },
    ],
    verifiedBy: {
      type: String, // Verifier wallet address
    },
    verifiedAt: {
      type: Date,
    },
    blockchainTxHash: {
      type: String, // Registration transaction hash
    },
    metadata: {
      builtUpArea: Number,
      floors: Number,
      yearBuilt: Number,
      amenities: [String],
      description: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (surveyNumber has unique index already, only add others)
propertySchema.index({ currentOwner: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ "location.city": 1, "location.state": 1 });

module.exports = mongoose.model("Property", propertySchema);
