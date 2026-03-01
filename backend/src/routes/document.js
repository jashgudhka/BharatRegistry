const express = require("express");
const router = express.Router();
const multer = require("multer");
const Document = require("../models/Document");
const { auth, authorize } = require("../middleware/auth");
const ipfsService = require("../services/ipfsService");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, images, and Word documents are allowed."));
    }
  },
});

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 */
router.post("/upload", auth, upload.single("document"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { documentType, propertyId, description } = req.body;

    // Upload to IPFS-like storage
    const result = await ipfsService.uploadFile(req.file.buffer, req.file.originalname);

    // Check if document already exists
    let doc = await Document.findOne({ hash: result.hash });
    if (doc) {
      return res.json({
        success: true,
        message: "Document already uploaded",
        data: {
          hash: doc.hash,
          status: doc.status,
          documentType: doc.documentType,
        },
      });
    }

    // Create document record
    doc = new Document({
      hash: result.hash,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: result.size,
      filePath: result.path,
      uploadedBy: req.walletAddress,
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      documentType: documentType || "other",
      description,
      status: "pending",
    });

    await doc.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully. Awaiting admin verification.",
      data: {
        hash: doc.hash,
        originalName: doc.originalName,
        documentType: doc.documentType,
        status: doc.status,
        uploadedAt: doc.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/documents/my:
 *   get:
 *     summary: Get my uploaded documents
 *     tags: [Documents]
 */
router.get("/my", auth, async (req, res, next) => {
  try {
    const documents = await Document.find({ uploadedBy: req.walletAddress })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/documents/verify/{hash}:
 *   get:
 *     summary: Verify a document exists by hash (public)
 *     tags: [Documents]
 */
router.get("/verify/:hash", async (req, res, next) => {
  try {
    const { hash } = req.params;

    const doc = await Document.findOne({ hash }).select(
      "-filePath"
    );

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found. The hash may be invalid.",
      });
    }

    res.json({
      success: true,
      data: {
        hash: doc.hash,
        originalName: doc.originalName,
        documentType: doc.documentType,
        status: doc.status,
        uploadedBy: doc.uploadedBy,
        propertyId: doc.propertyId,
        verifiedBy: doc.verifiedBy,
        verifiedAt: doc.verifiedAt,
        uploadedAt: doc.createdAt,
        size: doc.size,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/documents/{hash}/download:
 *   get:
 *     summary: Download a document by hash
 *     tags: [Documents]
 */
router.get("/:hash/download", auth, async (req, res, next) => {
  try {
    const { hash } = req.params;

    const doc = await Document.findOne({ hash });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const fileBuffer = ipfsService.getFile(hash);
    if (!fileBuffer) {
      return res.status(404).json({
        success: false,
        message: "File not found on storage",
      });
    }

    res.set({
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${doc.originalName}"`,
      "Content-Length": fileBuffer.length,
    });

    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/documents/property/{propertyId}:
 *   get:
 *     summary: Get documents for a property
 *     tags: [Documents]
 */
router.get("/property/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const documents = await Document.find({
      propertyId: parseInt(propertyId),
    })
      .select("-filePath")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
