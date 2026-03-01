const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");
const { validatePagination } = require("../middleware/validation");

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  auth,
  authorize("admin"),
  validatePagination,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.isVerified)
        filter.isVerified = req.query.isVerified === "true";

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-nonce -aadhaarHash")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: {
          users,
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
  }
);

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   get:
 *     summary: Get user by wallet address
 *     tags: [Users]
 */
router.get("/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    const user = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    }).select("-nonce -aadhaarHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/users/{walletAddress}/role:
 *   put:
 *     summary: Update user role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:walletAddress/role",
  auth,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { walletAddress } = req.params;
      const { role } = req.body;

      if (!["user", "verifier", "registrar", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      const user = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { role },
        { new: true }
      ).select("-nonce -aadhaarHash");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/{walletAddress}/verify:
 *   put:
 *     summary: Verify user KYC (admin/verifier only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:walletAddress/verify",
  auth,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const { walletAddress } = req.params;
      const { isVerified } = req.body;

      const user = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { isVerified },
        { new: true }
      ).select("-nonce -aadhaarHash");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/users/stats/overview:
 *   get:
 *     summary: Get user statistics (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/stats/overview",
  auth,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            verified: {
              $sum: { $cond: ["$isVerified", 1, 0] },
            },
          },
        },
      ]);

      const total = await User.countDocuments();

      res.json({
        success: true,
        data: {
          total,
          byRole: stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
