const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const { auth, optionalAuth, authorize } = require("../middleware/auth");
const { requireWallet } = require("../middleware/requireWallet");
const { validatePropertyId, validatePagination } = require("../middleware/validation");
const blockchainService = require("../services/blockchainService");

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties with pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get("/", validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.city) filter["location.city"] = new RegExp(req.query.city, "i");
    if (req.query.state) filter["location.state"] = new RegExp(req.query.state, "i");
    if (req.query.propertyType) filter.propertyType = req.query.propertyType;
    if (req.query.owner) filter.currentOwner = req.query.owner.toLowerCase();

    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        properties,
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
 * /api/properties/{propertyId}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Property details
 */
router.get("/:propertyId", validatePropertyId, async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Get from blockchain
    const blockchainProperty = await blockchainService.getProperty(propertyId);

    // Get from database for additional metadata
    const dbProperty = await Property.findOne({ propertyId: parseInt(propertyId) });

    res.json({
      success: true,
      data: {
        ...blockchainProperty,
        metadata: dbProperty?.metadata || {},
        documents: dbProperty?.documents || [],
        previousOwners: dbProperty?.previousOwners || [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/properties/owner/{walletAddress}:
 *   get:
 *     summary: Get properties by owner
 *     tags: [Properties]
 */
router.get("/owner/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;

    // Get property IDs from blockchain
    const propertyIds = await blockchainService.getOwnerProperties(walletAddress);

    // Get full property details
    const properties = await Promise.all(
      propertyIds.map((id) => blockchainService.getProperty(id))
    );

    res.json({
      success: true,
      data: {
        count: properties.length,
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/properties/search:
 *   get:
 *     summary: Search properties
 *     tags: [Properties]
 */
router.get("/search/query", async (req, res, next) => {
  try {
    const { q, minArea, maxArea, minPrice, maxPrice, status } = req.query;

    const filter = {};

    if (q) {
      filter.$or = [
        { surveyNumber: new RegExp(q, "i") },
        { "location.address": new RegExp(q, "i") },
        { "location.city": new RegExp(q, "i") },
      ];
    }

    if (minArea || maxArea) {
      filter.area = {};
      if (minArea) filter.area.$gte = parseInt(minArea);
      if (maxArea) filter.area.$lte = parseInt(maxArea);
    }

    if (status) {
      filter.status = status;
    }

    const properties = await Property.find(filter).limit(50);

    res.json({
      success: true,
      data: {
        count: properties.length,
        properties,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Sync property from blockchain (after on-chain registration)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 */
router.post("/sync/:propertyId", auth, requireWallet, validatePropertyId, async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { metadata, documents, transactionHash } = req.body;

    // Get property from blockchain
    const blockchainProperty = await blockchainService.getProperty(propertyId);

    // Verify caller is the owner
    if (blockchainProperty.currentOwner.toLowerCase() !== req.walletAddress) {
      return res.status(403).json({
        success: false,
        message: "Only the property owner can sync property data",
      });
    }

    // Create or update in database
    const property = await Property.findOneAndUpdate(
      { propertyId: parseInt(propertyId) },
      {
        propertyId: blockchainProperty.propertyId,
        surveyNumber: blockchainProperty.surveyNumber,
        location: {
          address: blockchainProperty.location,
        },
        area: blockchainProperty.area,
        currentOwner: blockchainProperty.currentOwner.toLowerCase(),
        marketValue: blockchainProperty.marketValue,
        status: blockchainProperty.status,
        registrationDate: blockchainProperty.registrationDate,
        metadata,
        documents,
        blockchainTxHash: transactionHash,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/properties/stats:
 *   get:
 *     summary: Get property statistics
 *     tags: [Properties]
 */
router.get("/stats/overview", async (req, res, next) => {
  try {
    const [totalOnChain, dbStats] = await Promise.all([
      blockchainService.getTotalProperties(),
      Property.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {};
    dbStats.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalOnChain,
        statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
