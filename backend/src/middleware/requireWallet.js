/**
 * Middleware to ensure the authenticated user has a wallet connected.
 * Must be used AFTER the auth middleware.
 */
const requireWallet = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (!req.user.walletAddress) {
    return res.status(403).json({
      success: false,
      message: "Wallet connection required.",
      requiresWallet: true,
    });
  }

  next();
};

module.exports = { requireWallet };
