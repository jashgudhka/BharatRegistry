const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transferId: {
      type: Number,
      required: true,
      unique: true,
    },
    propertyId: {
      type: Number,
      required: true,
    },
    seller: {
      type: String, // Wallet address
      required: true,
      lowercase: true,
    },
    buyer: {
      type: String, // Wallet address
      required: true,
      lowercase: true,
    },
    agreedPrice: {
      type: String, // In wei
      required: true,
    },
    escrowAmount: {
      type: String,
      default: "0",
    },
    status: {
      type: String,
      enum: [
        "initiated",
        "escrow_funded",
        "approved_by_seller",
        "approved_by_registrar",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "initiated",
    },
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        actor: String, // Wallet address
        transactionHash: String,
        notes: String,
      },
    ],
    platformFee: {
      type: String,
      default: "0",
    },
    initiationTxHash: String,
    escrowTxHash: String,
    completionTxHash: String,
    disputeReason: String,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ propertyId: 1 });
transactionSchema.index({ seller: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
