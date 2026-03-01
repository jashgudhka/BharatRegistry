const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "verifier", "registrar", "admin"],
      default: "user",
    },
    aadhaarHash: {
      type: String, // Hashed Aadhaar for privacy
    },
    panNumber: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    kycDocuments: [
      {
        type: {
          type: String,
          enum: ["aadhaar", "pan", "passport", "voter_id"],
        },
        ipfsHash: String,
        verified: {
          type: Boolean,
          default: false,
        },
        uploadedAt: Date,
      },
    ],
    nonce: {
      type: String, // For wallet signature verification
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
