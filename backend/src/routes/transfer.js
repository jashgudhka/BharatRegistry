const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const { auth, authorize } = require("../middleware/auth");
const {
  validateTransferId,
  validatePagination,
} = require("../middleware/validation");
const blockchainService = require("../services/blockchainService");

/**
 * @swagger
 * /api/transfers:
 *   get:
 *     summary: Get all transfers with pagination
 *     tags: [Transfers]
 */
router.get("/", validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.propertyId)
      filter.propertyId = parseInt(req.query.propertyId);

    const [transfers, total] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transfers/{transferId}:
 *   get:
 *     summary: Get transfer by ID
 *     tags: [Transfers]
 */
router.get("/:transferId", validateTransferId, async (req, res, next) => {
  try {
    const { transferId } = req.params;

    // Get from blockchain
    const blockchainTransfer = await blockchainService.getTransfer(transferId);

    // Get from database for timeline
    const dbTransfer = await Transaction.findOne({
      transferId: parseInt(transferId),
    });

    res.json({
      success: true,
      data: {
        ...blockchainTransfer,
        timeline: dbTransfer?.timeline || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transfers/user/{walletAddress}:
 *   get:
 *     summary: Get transfers by user
 *     tags: [Transfers]
 */
router.get("/user/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    // Get transfer IDs from blockchain
    const transferIds = await blockchainService.getUserTransfers(walletAddress);

    // Get full transfer details
    const transfers = await Promise.all(
      transferIds.map((id) => blockchainService.getTransfer(id))
    );

    res.json({
      success: true,
      data: {
        count: transfers.length,
        transfers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transfers/property/{propertyId}:
 *   get:
 *     summary: Get transfers for a property
 *     tags: [Transfers]
 */
router.get("/property/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const transferIds = await blockchainService.getPropertyTransfers(
      propertyId
    );

    const transfers = await Promise.all(
      transferIds.map((id) => blockchainService.getTransfer(id))
    );

    res.json({
      success: true,
      data: {
        count: transfers.length,
        transfers,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/transfers/sync/{transferId}:
 *   post:
 *     summary: Sync transfer from blockchain
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/sync/:transferId",
  auth,
  validateTransferId,
  async (req, res, next) => {
    try {
      const { transferId } = req.params;
      const { transactionHash, notes } = req.body;

      // Get from blockchain
      const blockchainTransfer = await blockchainService.getTransfer(
        transferId
      );

      // Verify caller is involved
      const isAuthorized =
        blockchainTransfer.seller.toLowerCase() === req.walletAddress ||
        blockchainTransfer.buyer.toLowerCase() === req.walletAddress;

      if (!isAuthorized && req.user.role === "user") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to sync this transfer",
        });
      }

      // Update or create in database
      const transfer = await Transaction.findOneAndUpdate(
        { transferId: parseInt(transferId) },
        {
          transferId: blockchainTransfer.transferId,
          propertyId: blockchainTransfer.propertyId,
          seller: blockchainTransfer.seller.toLowerCase(),
          buyer: blockchainTransfer.buyer.toLowerCase(),
          agreedPrice: blockchainTransfer.agreedPrice,
          escrowAmount: blockchainTransfer.escrowAmount,
          status: blockchainTransfer.status,
          $push: {
            timeline: {
              status: blockchainTransfer.status,
              actor: req.walletAddress,
              transactionHash,
              notes,
            },
          },
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        data: transfer,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/transfers/stats:
 *   get:
 *     summary: Get transfer statistics
 *     tags: [Transfers]
 */
router.get("/stats/overview", async (req, res, next) => {
  try {
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: { $toDouble: "$agreedPrice" } },
        },
      },
    ]);

    const completed = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: { $toDouble: "$agreedPrice" } },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        completed: completed[0] || { totalTransactions: 0, totalVolume: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
