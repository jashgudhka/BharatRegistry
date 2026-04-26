const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Primary wallet used for blockchain interactions
    walletAddress: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
    },

    // Additional linked wallets
    linkedWallets: [
      {
        address: { type: String, lowercase: true },
        linkedAt: { type: Date, default: Date.now },
        label: String,
      },
    ],

    password: {
      type: String,
      required: true,
      select: false,
    },

    // Personal Details
    fullName: {
      type: String,
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // Address
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    // Identity Documents
    panNumber: {
      type: String,
      uppercase: true,
    },
    panType: {
      type: String, // e.g., "Individual (Person)", "Company"
    },
    aadhaarHash: {
      type: String, // SHA-256 hash of Aadhaar for privacy
    },

    // Registration status
    registrationComplete: {
      type: Boolean,
      default: false,
    },

    // Role
    role: {
      type: String,
      enum: ["user", "verifier", "registrar", "admin", "bank", "super_admin"],
      default: "user",
    },

    // KYC
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: String, // admin wallet address
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },

    kycDocuments: [
      {
        type: {
          type: String,
          enum: ["aadhaar", "pan", "passport", "voter_id"],
        },
        documentHash: String,
        verified: {
          type: Boolean,
          default: false,
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Auth
    nonce: {
      type: String, // For wallet signature verification
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ registrationComplete: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ panNumber: 1 });

module.exports = mongoose.model("User", userSchema);
