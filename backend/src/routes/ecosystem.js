const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const { requireWallet } = require("../middleware/requireWallet");
const blockchainService = require("../services/blockchainService");

const toInteger = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toUnixSeconds = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric > 1e12 ? Math.floor(numeric / 1000) : Math.floor(numeric);
  }

  const parsedDate = Date.parse(value);
  if (!Number.isNaN(parsedDate)) {
    return Math.floor(parsedDate / 1000);
  }

  return 0;
};

// ============================================================
// Read APIs (public verifiability)
// ============================================================

router.get("/documents/authentic/:hash", async (req, res, next) => {
  try {
    const isAuthentic = await blockchainService.isDocumentAuthentic(
      req.params.hash,
    );
    const document = isAuthentic
      ? await blockchainService.getDocument(req.params.hash)
      : null;

    res.json({
      success: true,
      data: {
        hash: req.params.hash,
        isAuthentic,
        document,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/identity/:walletAddress", async (req, res, next) => {
  try {
    const identity = await blockchainService.getIdentity(
      req.params.walletAddress,
    );
    const hasActiveKyc = await blockchainService.hasActiveKyc(
      req.params.walletAddress,
    );

    res.json({
      success: true,
      data: {
        ...identity,
        hasActiveKyc,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/mortgages/:lienId", async (req, res, next) => {
  try {
    const lien = await blockchainService.getLien(toInteger(req.params.lienId));
    res.json({ success: true, data: lien });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/mortgages/property/:propertyId/encumbrance",
  async (req, res, next) => {
    try {
      const propertyId = toInteger(req.params.propertyId);
      const hasActiveEncumbrance =
        await blockchainService.hasActiveEncumbrance(propertyId);

      res.json({
        success: true,
        data: {
          propertyId,
          hasActiveEncumbrance,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.get("/disputes/:disputeId", async (req, res, next) => {
  try {
    const dispute = await blockchainService.getDispute(
      toInteger(req.params.disputeId),
    );
    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
});

router.get("/disputes/property/:propertyId/blocked", async (req, res, next) => {
  try {
    const propertyId = toInteger(req.params.propertyId);
    const isBlocked = await blockchainService.isPropertyBlocked(propertyId);

    res.json({ success: true, data: { propertyId, isBlocked } });
  } catch (error) {
    next(error);
  }
});

router.get("/disputes/transfer/:transferId/blocked", async (req, res, next) => {
  try {
    const transferId = toInteger(req.params.transferId);
    const isBlocked = await blockchainService.isTransferBlocked(transferId);

    res.json({ success: true, data: { transferId, isBlocked } });
  } catch (error) {
    next(error);
  }
});

router.get("/insurance/policies/:policyId", async (req, res, next) => {
  try {
    const policy = await blockchainService.getPolicy(
      toInteger(req.params.policyId),
    );
    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
});

router.get("/token/property/:propertyId", async (req, res, next) => {
  try {
    const tokenized = await blockchainService.getTokenizedProperty(
      toInteger(req.params.propertyId),
    );
    res.json({ success: true, data: tokenized });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/token/property/:propertyId/holder/:walletAddress",
  async (req, res, next) => {
    try {
      const propertyId = toInteger(req.params.propertyId);
      const walletAddress = req.params.walletAddress;
      const balance = await blockchainService.getShareBalance(
        propertyId,
        walletAddress,
      );

      res.json({
        success: true,
        data: {
          propertyId,
          walletAddress,
          ...balance,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// ============================================================
// Write APIs (role/identity controlled)
// ============================================================

router.post(
  "/documents/register",
  auth,
  requireWallet,
  authorize("admin", "verifier", "registrar"),
  async (req, res, next) => {
    try {
      const {
        contentHash,
        propertyId,
        subject,
        documentType = 5,
        uri = "",
        metadata = "",
      } = req.body;

      const tx = await blockchainService.registerDocumentOnChain({
        contentHash,
        propertyId: toInteger(propertyId),
        subject,
        documentType: toInteger(documentType, 5),
        uri,
        metadata,
      });

      res.json({
        success: true,
        message: "Document hash registered on-chain",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/documents/:hash/verify",
  auth,
  requireWallet,
  authorize("admin", "verifier", "registrar"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.verifyDocumentOnChain(req.params.hash);

      res.json({
        success: true,
        message: "Document verified on-chain",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/identity/submit", auth, requireWallet, async (req, res, next) => {
  try {
    const { identityHash, metadataURI = "" } = req.body;
    const tx = await blockchainService.submitIdentityOnChain(
      identityHash,
      metadataURI,
    );

    res.json({
      success: true,
      message: "Identity submitted for KYC review",
      data: { transactionHash: tx.hash },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/identity/review",
  auth,
  requireWallet,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const { account, approved, notes = "" } = req.body;
      const tx = await blockchainService.reviewIdentityOnChain(
        account,
        !!approved,
        notes,
      );

      res.json({
        success: true,
        message: approved ? "Identity approved" : "Identity rejected",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/identity/roles/grant",
  auth,
  requireWallet,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const { account, roleId } = req.body;
      const tx = await blockchainService.grantAccreditedRoleOnChain(
        account,
        toInteger(roleId),
      );

      res.json({
        success: true,
        message: "Accredited role granted",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/mortgages/create",
  auth,
  requireWallet,
  authorize("bank", "admin"),
  async (req, res, next) => {
    try {
      const {
        propertyId,
        borrower,
        principal,
        dueDate,
        referenceId = "",
      } = req.body;

      const tx = await blockchainService.createLienOnChain({
        propertyId: toInteger(propertyId),
        borrower,
        principal: principal?.toString() || "0",
        dueDate: toUnixSeconds(dueDate),
        referenceId,
      });

      res.json({
        success: true,
        message: "Lien created",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/mortgages/:lienId/outstanding",
  auth,
  requireWallet,
  authorize("bank", "admin", "registrar"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.updateLienOutstandingOnChain(
        toInteger(req.params.lienId),
        req.body.outstanding?.toString() || "0",
      );

      res.json({
        success: true,
        message: "Lien outstanding updated",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/mortgages/:lienId/close",
  auth,
  requireWallet,
  authorize("bank", "admin", "registrar"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.closeLienOnChain(
        toInteger(req.params.lienId),
        req.body.reason || "closed",
      );

      res.json({
        success: true,
        message: "Lien closed",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/disputes/open", auth, requireWallet, async (req, res, next) => {
  try {
    const {
      disputeType = 0,
      propertyId = 0,
      transferId = 0,
      respondent,
      blockProperty = false,
      blockTransfer = false,
      evidenceURI = "",
    } = req.body;

    const tx = await blockchainService.openDisputeOnChain({
      disputeType: toInteger(disputeType),
      propertyId: toInteger(propertyId),
      transferId: toInteger(transferId),
      respondent,
      blockProperty: !!blockProperty,
      blockTransfer: !!blockTransfer,
      evidenceURI,
    });

    res.json({
      success: true,
      message: "Dispute opened",
      data: { transactionHash: tx.hash },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/disputes/:disputeId/review",
  auth,
  requireWallet,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.moveDisputeToReviewOnChain(
        toInteger(req.params.disputeId),
      );

      res.json({
        success: true,
        message: "Dispute moved to review",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/disputes/:disputeId/resolve",
  auth,
  requireWallet,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const { outcome = 2, keepBlocks = false, resolutionURI = "" } = req.body;
      const tx = await blockchainService.resolveDisputeOnChain(
        toInteger(req.params.disputeId),
        toInteger(outcome),
        !!keepBlocks,
        resolutionURI,
      );

      res.json({
        success: true,
        message: "Dispute resolved",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/disputes/:disputeId/reject",
  auth,
  requireWallet,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.rejectDisputeOnChain(
        toInteger(req.params.disputeId),
        req.body.reasonURI || "",
      );

      res.json({
        success: true,
        message: "Dispute rejected",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/disputes/:disputeId/appeal",
  auth,
  requireWallet,
  async (req, res, next) => {
    try {
      const tx = await blockchainService.fileAppealOnChain(
        toInteger(req.params.disputeId),
        req.body.evidenceURI || "",
      );

      res.json({
        success: true,
        message: "Appeal filed",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/insurance/reserve/fund",
  auth,
  requireWallet,
  authorize("bank", "admin"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.fundInsuranceReserveOnChain(
        req.body.amountWei?.toString() || "0",
      );

      res.json({
        success: true,
        message: "Insurance reserve funded",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/insurance/policies/issue",
  auth,
  requireWallet,
  authorize("bank", "admin"),
  async (req, res, next) => {
    try {
      const {
        propertyId,
        policyHolder,
        premium = "0",
        coverageAmount,
        expiryAt,
        policyURI = "",
      } = req.body;

      const tx = await blockchainService.issuePolicyOnChain({
        propertyId: toInteger(propertyId),
        policyHolder,
        premium: premium.toString(),
        coverageAmount: coverageAmount?.toString() || "0",
        expiryAt: toUnixSeconds(expiryAt),
        policyURI,
      });

      res.json({
        success: true,
        message: "Title insurance policy issued",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/insurance/policies/:policyId/payout",
  auth,
  requireWallet,
  authorize("admin", "verifier"),
  async (req, res, next) => {
    try {
      const tx = await blockchainService.payoutClaimFromDisputeOnChain(
        toInteger(req.params.policyId),
        toInteger(req.body.disputeId),
      );

      res.json({
        success: true,
        message: "Claim payout executed",
        data: { transactionHash: tx.hash },
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/tokenize", auth, requireWallet, async (req, res, next) => {
  try {
    const { propertyId, totalShares, tokenUri = "" } = req.body;
    const tx = await blockchainService.tokenizePropertyOnChain(
      toInteger(propertyId),
      toInteger(totalShares),
      tokenUri,
    );

    res.json({
      success: true,
      message: "Property tokenized",
      data: { transactionHash: tx.hash },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
