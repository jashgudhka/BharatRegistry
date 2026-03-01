const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ethers } = require("ethers");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const blockchainService = require("../services/blockchainService");

/**
 * @swagger
 * /api/auth/nonce/{walletAddress}:
 *   get:
 *     summary: Get nonce for wallet signature
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nonce for signing
 */
router.get("/nonce/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const normalizedAddress = walletAddress.toLowerCase();

    // Generate random nonce
    const nonce = crypto.randomBytes(32).toString("hex");

    // Find or create user
    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user) {
      user = new User({
        walletAddress: normalizedAddress,
        nonce,
      });
    } else {
      user.nonce = nonce;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        nonce,
        message: `Sign this message to authenticate with Bharat Registry:\n\nNonce: ${nonce}`,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify wallet signature and get JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               walletAddress:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT token
 */
router.post("/verify", async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;
    const normalizedAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedAddress });

    if (!user || !user.nonce) {
      return res.status(400).json({
        success: false,
        message: "Please request a nonce first",
      });
    }

    // Verify signature
    const message = `Sign this message to authenticate with Bharat Registry:\n\nNonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Generate new nonce for next login
    user.nonce = crypto.randomBytes(32).toString("hex");
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      {
        walletAddress: normalizedAddress,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          walletAddress: user.walletAddress,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/me", auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      walletAddress: req.user.walletAddress,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { name, email, phone },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
