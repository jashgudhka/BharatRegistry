const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const Document = require("../models/Document");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");
const blockchainService = require("../services/blockchainService");

// All bank routes require bank role
router.use(auth);
router.use(authorize("bank", "admin"));

/**
 * @swagger
 * /api/bank/dashboard:
 *   get:
 *     summary: Bank dashboard stats
 *     tags: [Bank]
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    const totalProperties = await Property.countDocuments({ status: "verified" });
    const totalVerifiedDocs = await Document.countDocuments({ status: "verified" });

    res.json({
      success: true,
      data: {
        totalVerifiedProperties: totalProperties,
        totalVerifiedDocuments: totalVerifiedDocs,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bank/verify-property/{propertyId}:
 *   get:
 *     summary: Verify a property for loan/mortgage purposes
 *     tags: [Bank]
 */
router.get("/verify-property/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Get from database
    const property = await Property.findOne({ propertyId: parseInt(propertyId) });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get owner info
    const owner = await User.findOne({
      walletAddress: property.currentOwner,
    }).select("fullName walletAddress isVerified panNumber");

    // Get documents
    const documents = await Document.find({
      propertyId: parseInt(propertyId),
      status: "verified",
    }).select("-filePath");

    // Get transfer history
    const transfers = await Transaction.find({
      propertyId: parseInt(propertyId),
    }).sort({ createdAt: -1 });

    // Check lien status (any active transfer means property is in process)
    const activeTransfers = await Transaction.countDocuments({
      propertyId: parseInt(propertyId),
      status: { $in: ["initiated", "escrow_funded", "approved_by_seller", "approved_by_registrar"] },
    });

    res.json({
      success: true,
      data: {
        property: {
          propertyId: property.propertyId,
          surveyNumber: property.surveyNumber,
          location: property.location,
          area: property.area,
          propertyType: property.propertyType,
          marketValue: property.marketValue,
          status: property.status,
          registrationDate: property.registrationDate,
        },
        owner,
        documents,
        transferHistory: transfers,
        lienStatus: {
          hasActiveLien: activeTransfers > 0,
          activeTransferCount: activeTransfers,
        },
        isVerified: property.status === "verified",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bank/verify-document/{hash}:
 *   get:
 *     summary: Verify a document by its IPFS hash
 *     tags: [Bank]
 */
router.get("/verify-document/:hash", async (req, res, next) => {
  try {
    const { hash } = req.params;

    const doc = await Document.findOne({
      $or: [{ hash }, { ipfsHash: hash }],
    }).select("-filePath");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
        verified: false,
      });
    }

    // Get associated property if any
    let property = null;
    if (doc.propertyId) {
      property = await Property.findOne({ propertyId: doc.propertyId });
    }

    res.json({
      success: true,
      data: {
        document: {
          hash: doc.hash,
          originalName: doc.originalName,
          documentType: doc.documentType,
          status: doc.status,
          uploadedBy: doc.uploadedBy,
          verifiedBy: doc.verifiedBy,
          verifiedAt: doc.verifiedAt,
          createdAt: doc.createdAt,
        },
        property: property
          ? {
              propertyId: property.propertyId,
              surveyNumber: property.surveyNumber,
              location: property.location,
              status: property.status,
            }
          : null,
        isAuthentic: doc.status === "verified",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/bank/owner-properties/{walletAddress}:
 *   get:
 *     summary: Get all verified properties of an owner
 *     tags: [Bank]
 */
router.get("/owner-properties/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    const properties = await Property.find({
      currentOwner: walletAddress.toLowerCase(),
      status: "verified",
    });

    const owner = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
    }).select("fullName walletAddress isVerified panNumber");

    res.json({
      success: true,
      data: {
        owner,
        properties,
        count: properties.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
