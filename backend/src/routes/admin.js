const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Property = require("../models/Property");
const Document = require("../models/Document");
const Transaction = require("../models/Transaction");
const { auth, authorize } = require("../middleware/auth");

// All admin routes require admin or verifier role
router.use(auth);
router.use(authorize("admin", "verifier", "registrar"));

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      verifiedUsers,
      totalProperties,
      pendingProperties,
      verifiedProperties,
      pendingDocuments,
      totalTransfers,
      completedTransfers,
    ] = await Promise.all([
      User.countDocuments({ registrationComplete: true }),
      User.countDocuments({ registrationComplete: true, isVerified: false }),
      User.countDocuments({ isVerified: true }),
      Property.countDocuments(),
      Property.countDocuments({ status: "pending" }),
      Property.countDocuments({ status: "verified" }),
      Document.countDocuments({ status: "pending" }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "completed" }),
    ]);

    // Recent activity
    const recentUsers = await User.find({ registrationComplete: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("walletAddress fullName role isVerified createdAt");

    const recentProperties = await Property.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("propertyId surveyNumber status currentOwner createdAt");

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          pendingUsers,
          verifiedUsers,
          totalProperties,
          pendingProperties,
          verifiedProperties,
          pendingDocuments,
          totalTransfers,
          completedTransfers,
        },
        recentUsers,
        recentProperties,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filters
 *     tags: [Admin]
 */
router.get("/users", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { registrationComplete: true };
    if (req.query.verified === "true") filter.isVerified = true;
    if (req.query.verified === "false") filter.isVerified = false;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { fullName: new RegExp(req.query.search, "i") },
        { walletAddress: new RegExp(req.query.search, "i") },
        { panNumber: new RegExp(req.query.search, "i") },
      ];
    }

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
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users/pending:
 *   get:
 *     summary: Get users awaiting KYC verification
 *     tags: [Admin]
 */
router.get("/users/pending", async (req, res, next) => {
  try {
    const users = await User.find({
      registrationComplete: true,
      isVerified: false,
    })
      .select("-nonce")
      .sort({ createdAt: 1 }); // oldest first

    res.json({
      success: true,
      data: { users, count: users.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users/:walletAddress/verify:
 *   put:
 *     summary: Approve or reject user KYC
 *     tags: [Admin]
 */
router.put("/users/:walletAddress/verify", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { approved, reason } = req.body;

    const update = {
      isVerified: approved,
      verifiedBy: req.walletAddress,
      verifiedAt: new Date(),
    };

    if (!approved && reason) {
      update.rejectionReason = reason;
    }

    const user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      update,
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
      message: approved ? "User KYC approved" : "User KYC rejected",
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users/:walletAddress/role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 */
router.put("/users/:walletAddress/role", authorize("admin"), async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const { role } = req.body;

    if (!["user", "verifier", "registrar", "admin", "bank"].includes(role)) {
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Property Management
// ============================================================

/**
 * @swagger
 * /api/admin/properties/pending:
 *   get:
 *     summary: Get properties awaiting verification
 *     tags: [Admin]
 */
router.get("/properties/pending", async (req, res, next) => {
  try {
    const properties = await Property.find({ status: "pending" })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { properties, count: properties.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/properties/:propertyId/verify:
 *   put:
 *     summary: Approve property
 *     tags: [Admin]
 */
router.put("/properties/:propertyId/verify", async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { approved, reason } = req.body;

    const update = {
      status: approved ? "verified" : "disputed",
      verifiedBy: req.walletAddress,
      verifiedAt: new Date(),
    };

    const property = await Property.findOneAndUpdate(
      { propertyId: parseInt(propertyId) },
      update,
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({
      success: true,
      message: approved ? "Property verified" : "Property rejected",
      data: property,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Document Management
// ============================================================

/**
 * @swagger
 * /api/admin/documents/pending:
 *   get:
 *     summary: Get documents awaiting verification
 *     tags: [Admin]
 */
router.get("/documents/pending", async (req, res, next) => {
  try {
    const documents = await Document.find({ status: "pending" })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { documents, count: documents.length },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/documents/:hash/verify:
 *   put:
 *     summary: Approve or reject a document
 *     tags: [Admin]
 */
router.put("/documents/:hash/verify", async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { approved, reason, notes } = req.body;

    const update = {
      status: approved ? "verified" : "rejected",
      verifiedBy: req.walletAddress,
      verifiedAt: new Date(),
      verificationNotes: notes,
    };

    if (!approved && reason) {
      update.rejectionReason = reason;
    }

    // If approved, assign the IPFS hash (the content hash is the IPFS hash)
    if (approved) {
      update.ipfsHash = hash;
    }

    const doc = await Document.findOneAndUpdate(
      { hash },
      update,
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: approved
        ? "Document verified. IPFS hash assigned."
        : "Document rejected",
      data: doc,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// Transfer Management
// ============================================================

/**
 * @swagger
 * /api/admin/transfers:
 *   get:
 *     summary: Get all transfers
 *     tags: [Admin]
 */
router.get("/transfers", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const transfers = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: { transfers },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
