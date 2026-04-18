const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { ethers } = require("ethers");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { signJwt } = require("../utils/jwt");
const {
  validateAadhaar,
  validatePAN,
  hashAadhaar,
  validatePhone,
  validatePincode,
} = require("../utils/validators");

const buildWalletSignatureMessage = (nonce) =>
  `Sign this message to authenticate your wallet with Bharat Registry:\n\nNonce: ${nonce}`;

const findWalletOwner = (walletAddress, excludedUserId = null) => {
  const query = {
    $or: [{ walletAddress }, { "linkedWallets.address": walletAddress }],
  };

  if (excludedUserId) {
    query._id = { $ne: excludedUserId };
  }

  return User.findOne(query);
};

const generateToken = (user) => {
  return signJwt(
    {
      userId: user._id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      isVerified: user.isVerified,
    },
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

/**
 * @swagger
 * /api/auth/check/{walletAddress}:
 *   get:
 *     summary: Check if wallet is linked to any account
 *     tags: [Auth]
 */
router.get("/check/:walletAddress", async (req, res, next) => {
  try {
    const { walletAddress } = req.params;
    const normalizedAddress = walletAddress.toLowerCase();

    const user = await findWalletOwner(normalizedAddress);

    if (!user) {
      return res.json({
        success: true,
        data: {
          registered: false,
          registrationComplete: false,
          walletLinked: false,
          message: "Wallet not linked. Please login and link your wallet.",
        },
      });
    }

    res.json({
      success: true,
      data: {
        registered: true,
        registrationComplete: user.registrationComplete,
        walletLinked: true,
        message:
          "Wallet linked to an account. Please authenticate to continue.",
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
 *     summary: Register a new user with email and password
 *     tags: [Auth]
 */
router.post("/register", async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      fatherName,
      dateOfBirth,
      gender,
      phone,
      address,
      panNumber,
      aadhaarNumber,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
      });
    }

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

    if (phone) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        return res.status(400).json({
          success: false,
          message: phoneResult.error,
        });
      }
    }

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

    const existingPan = await User.findOne({
      panNumber: panNumber.toUpperCase(),
    });
    if (existingPan) {
      return res.status(400).json({
        success: false,
        message: "This PAN number is already registered with another account",
      });
    }

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

    const aadhaarHashed = hashAadhaar(aadhaarNumber);
    const existingAadhaar = await User.findOne({
      aadhaarHash: aadhaarHashed,
    });
    if (existingAadhaar) {
      return res.status(400).json({
        success: false,
        message:
          "This Aadhaar number is already registered with another account",
      });
    }

    if (address && address.pincode) {
      const pincodeResult = validatePincode(address.pincode);
      if (!pincodeResult.valid) {
        return res.status(400).json({
          success: false,
          message: pincodeResult.error,
        });
      }
    }

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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      email: normalizedEmail,
      password: hashedPassword,
      fullName: fullName.trim(),
      fatherName: fatherName?.trim(),
      dateOfBirth: dob,
      age,
      gender,
      phone,
      address: address || {},
      panNumber: panNumber.toUpperCase(),
      panType: panResult.type,
      aadhaarHash: aadhaarHashed,
      registrationComplete: true,
    };

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "Registration successful! You can now log in.",
      data: {
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or identity is already registered",
      });
    }
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        token,
        user: {
          email: user.email,
          fullName: user.fullName,
          walletAddress: user.walletAddress,
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
 * /api/auth/nonce:
 *   get:
 *     summary: Get nonce to sign for wallet linking
 *     tags: [Auth]
 */
router.get("/nonce", auth, async (req, res, next) => {
  try {
    const user = req.user;
    const nonce = crypto.randomBytes(32).toString("hex");
    user.nonce = nonce;
    await user.save();

    res.json({
      success: true,
      data: {
        nonce,
        message: buildWalletSignatureMessage(nonce),
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
 *     summary: Verify signature and link wallet to account
 *     tags: [Auth]
 */
router.post("/verify", auth, async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        message: "Wallet address and signature are required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const user = req.user;

    if (!user.nonce) {
      return res.status(400).json({
        success: false,
        message: "Please request a nonce first",
      });
    }

    // Check if wallet is used by someone else
    const existingWalletOwner = await findWalletOwner(
      normalizedAddress,
      user._id,
    );

    if (existingWalletOwner) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already linked to another account",
      });
    }

    // Verify signature
    const message = buildWalletSignatureMessage(user.nonce);
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    // Clear nonce
    user.nonce = crypto.randomBytes(32).toString("hex");

    // Link wallet
    if (!user.walletAddress) {
      user.walletAddress = normalizedAddress;
    } else if (user.walletAddress !== normalizedAddress) {
      const isAlreadyLinked = user.linkedWallets.find(
        (w) => w.address === normalizedAddress,
      );
      if (!isAlreadyLinked) {
        user.linkedWallets.push({
          address: normalizedAddress,
          label: "Additional Wallet",
        });
      }
    }

    await user.save();

    // Re-issue token with new wallet address
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Wallet linked successfully!",
      data: {
        token,
        user: {
          email: user.email,
          fullName: user.fullName,
          walletAddress: user.walletAddress,
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
  const user = req.user;
  res.json({
    success: true,
    data: {
      email: user.email,
      walletAddress: user.walletAddress,
      fullName: user.fullName,
      fatherName: user.fatherName,
      dateOfBirth: user.dateOfBirth,
      age: user.age,
      gender: user.gender,
      phone: user.phone,
      address: user.address,
      panNumber: user.panNumber,
      role: user.role,
      isVerified: user.isVerified,
      registrationComplete: user.registrationComplete,
      linkedWallets: user.linkedWallets,
      createdAt: user.createdAt,
    },
  });
});

/**
 * @swagger
 * /api/auth/link-wallet:
 *   post:
 *     summary: Link an additional wallet to the account manually
 *     tags: [Auth]
 */
router.post("/link-wallet", auth, async (req, res, next) => {
  try {
    const { walletAddress, signature, label } = req.body;

    if (!walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        message: "Wallet address and signature are required",
      });
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const user = req.user;

    if (!user.nonce) {
      return res.status(400).json({
        success: false,
        message: "Please request a nonce first",
      });
    }

    const message = buildWalletSignatureMessage(user.nonce);
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const existing = await findWalletOwner(normalizedAddress, user._id);

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already linked to an account",
      });
    }

    if (user.walletAddress === normalizedAddress) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already your primary wallet",
      });
    }

    const alreadyLinked = user.linkedWallets.some(
      (wallet) => wallet.address === normalizedAddress,
    );
    if (alreadyLinked) {
      return res.status(400).json({
        success: false,
        message: "This wallet is already linked to your account",
      });
    }

    user.linkedWallets.push({
      address: normalizedAddress,
      label: label || "Additional Wallet",
    });

    // Rotate nonce so signatures cannot be replayed.
    user.nonce = crypto.randomBytes(32).toString("hex");

    await user.save();

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
    const { fullName, phone, address } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    });

    res.json({
      success: true,
      data: {
        email: user.email,
        walletAddress: user.walletAddress,
        fullName: user.fullName,
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
