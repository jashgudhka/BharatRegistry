const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { ethers } = require("ethers");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const {
  validateAadhaar,
  validatePAN,
  hashAadhaar,
  validatePhone,
  validatePincode,
} = require("../utils/validators");

/**
 * @swagger
 * /api/auth/check/{walletAddress}:
 *   get:
 *     summary: Check if wallet is registered on the platform
 *     tags: [Auth]
 */
router.get("/check/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const normalizedAddress = walletAddress.toLowerCase();

    const user = await User.findOne({
      $or: [
        { walletAddress: normalizedAddress },
        { "linkedWallets.address": normalizedAddress },
      ],
    });

    if (!user) {
      return res.json({
        success: true,
        data: {
          registered: false,
          registrationComplete: false,
          message: "Wallet not registered. Please register on the platform first.",
        },
      });
    }

    res.json({
      success: true,
      data: {
        registered: true,
        registrationComplete: user.registrationComplete,
        isVerified: user.isVerified,
        role: user.role,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user with personal details
 *     tags: [Auth]
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      walletAddress,
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      panNumber,
      aadhaarNumber,
    } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Check if wallet already registered
    const existing = await User.findOne({ walletAddress: normalizedAddress });
    if (existing && existing.registrationComplete) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already registered",
      });
    }

    // Validate required fields
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name is required (minimum 2 characters)",
      });
    }

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required",
      });
    }

    if (!gender || !["male", "female", "other"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender is required (male, female, or other)",
      });
    }

    // Validate phone
    if (phone) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        return res.status(400).json({
          success: false,
          message: phoneResult.error,
        });
      }
    }

    // Validate PAN
    if (!panNumber) {
      return res.status(400).json({
        success: false,
        message: "PAN number is required",
      });
    }
    const panResult = validatePAN(panNumber);
    if (!panResult.valid) {
      return res.status(400).json({
        success: false,
        message: panResult.error,
      });
    }

    // Check PAN uniqueness
    const existingPan = await User.findOne({
      panNumber: panNumber.toUpperCase(),
      walletAddress: { $ne: normalizedAddress },
    });
    if (existingPan) {
      return res.status(400).json({
        success: false,
        message: "This PAN number is already registered with another account",
      });
    }

    // Validate Aadhaar
    if (!aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: "Aadhaar number is required",
      });
    }
    const aadhaarResult = validateAadhaar(aadhaarNumber);
    if (!aadhaarResult.valid) {
      return res.status(400).json({
        success: false,
        message: aadhaarResult.error,
      });
    }

    // Check Aadhaar uniqueness (compare hashes)
    const aadhaarHashed = hashAadhaar(aadhaarNumber);
    const existingAadhaar = await User.findOne({
      aadhaarHash: aadhaarHashed,
      walletAddress: { $ne: normalizedAddress },
    });
    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message:
          "This Aadhaar number is already registered with another account",
      });
    }

    // Validate address
    if (address) {
      if (address.pincode) {
        const pincodeResult = validatePincode(address.pincode);
        if (!pincodeResult.valid) {
          return res.status(400).json({
            success: false,
            message: pincodeResult.error,
          });
        }
      }
    }

    // Calculate age
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old to register",
      });
    }

    // Generate nonce for immediate login
    const nonce = crypto.randomBytes(32).toString("hex");

    // Create or update user
    const userData = {
      walletAddress: normalizedAddress,
      fullName: fullName.trim(),
      fatherName: fatherName?.trim(),
      dateOfBirth: dob,
      age,
      gender,
      phone,
      email: email?.toLowerCase(),
      address: address || {},
      panNumber: panNumber.toUpperCase(),
      panType: panResult.type,
      aadhaarHash: aadhaarHashed,
      registrationComplete: true,
      nonce,
    };

    const user = await User.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      userData,
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now connect your wallet.",
      data: {
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        registrationComplete: user.registrationComplete,
        nonce,
        message: `Sign this message to authenticate with Bharat Registry:\n\nNonce: ${nonce}`,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This wallet address or identity is already registered",
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/nonce/{walletAddress}:
 *   get:
 *     summary: Get nonce for wallet signature (only for registered users)
 *     tags: [Auth]
 */
router.get("/nonce/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const normalizedAddress = walletAddress.toLowerCase();

    // Find registered user
    const user = await User.findOne({
      $or: [
        { walletAddress: normalizedAddress },
        { "linkedWallets.address": normalizedAddress },
      ],
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message:
          "Wallet not registered. Please register on the platform first.",
        requiresRegistration: true,
      });
    }

    if (!user.registrationComplete) {
      return res.status(403).json({
        success: false,
        message: "Registration not complete. Please complete your registration.",
        requiresRegistration: true,
      });
    }

    // Generate random nonce
    const nonce = crypto.randomBytes(32).toString("hex");
    user.nonce = nonce;
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
 */
router.post("/verify", async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;
    const normalizedAddress = walletAddress.toLowerCase();

    // Find user (check both primary and linked wallets)
    let user = await User.findOne({
      $or: [
        { walletAddress: normalizedAddress },
        { "linkedWallets.address": normalizedAddress },
      ],
    });

    if (!user || !user.nonce) {
      return res.status(400).json({
        success: false,
        message: "Please request a nonce first",
      });
    }

    if (!user.registrationComplete) {
      return res.status(403).json({
        success: false,
        message: "Registration not complete",
        requiresRegistration: true,
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
        walletAddress: user.walletAddress,
        role: user.role,
        isVerified: user.isVerified,
      },
      process.env.JWT_SECRET || "bharat-registry-secret-key",
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          walletAddress: user.walletAddress,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          registrationComplete: user.registrationComplete,
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
 */
router.get("/me", auth, async (req, res) => {
  res.json({
    success: true,
    data: {
      walletAddress: req.user.walletAddress,
      fullName: req.user.fullName,
      fatherName: req.user.fatherName,
      dateOfBirth: req.user.dateOfBirth,
      age: req.user.age,
      gender: req.user.gender,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      panNumber: req.user.panNumber,
      role: req.user.role,
      isVerified: req.user.isVerified,
      registrationComplete: req.user.registrationComplete,
      linkedWallets: req.user.linkedWallets,
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * @swagger
 * /api/auth/link-wallet:
 *   post:
 *     summary: Link an additional wallet to the account
 *     tags: [Auth]
 */
router.post("/link-wallet", auth, async (req, res, next) => {
  try {
    const { walletAddress, label } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Check if wallet is already used
    const existing = await User.findOne({
      $or: [
        { walletAddress: normalizedAddress },
        { "linkedWallets.address": normalizedAddress },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already linked to an account",
      });
    }

    const user = await User.findOneAndUpdate(
      { walletAddress: req.user.walletAddress },
      {
        $push: {
          linkedWallets: {
            address: normalizedAddress,
            label: label || "Additional Wallet",
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Wallet linked successfully",
      data: {
        linkedWallets: user.linkedWallets,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 */
router.put("/profile", auth, async (req, res, next) => {
  try {
    const { fullName, email, phone, address } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      data: {
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
