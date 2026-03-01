const { body, param, query, validationResult } = require("express-validator");

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Property registration validation
 */
const validatePropertyRegistration = [
  body("surveyNumber")
    .trim()
    .notEmpty()
    .withMessage("Survey number is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Survey number must be between 3 and 50 characters"),
  body("location").notEmpty().withMessage("Location is required"),
  body("area")
    .isNumeric()
    .withMessage("Area must be a number")
    .custom((value) => value > 0)
    .withMessage("Area must be greater than 0"),
  body("marketValue").notEmpty().withMessage("Market value is required"),
  body("propertyType")
    .optional()
    .isIn(["residential", "commercial", "agricultural", "industrial", "mixed"])
    .withMessage("Invalid property type"),
  handleValidationErrors,
];

/**
 * Transfer initiation validation
 */
const validateTransferInitiation = [
  body("propertyId").isNumeric().withMessage("Property ID must be a number"),
  body("offeredPrice").notEmpty().withMessage("Offered price is required"),
  handleValidationErrors,
];

/**
 * Wallet address validation
 */
const validateWalletAddress = [
  body("walletAddress")
    .trim()
    .notEmpty()
    .withMessage("Wallet address is required")
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage("Invalid wallet address format"),
  handleValidationErrors,
];

/**
 * Property ID parameter validation
 */
const validatePropertyId = [
  param("propertyId").isNumeric().withMessage("Property ID must be a number"),
  handleValidationErrors,
];

/**
 * Transfer ID parameter validation
 */
const validateTransferId = [
  param("transferId").isNumeric().withMessage("Transfer ID must be a number"),
  handleValidationErrors,
];

/**
 * Pagination query validation
 */
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validatePropertyRegistration,
  validateTransferInitiation,
  validateWalletAddress,
  validatePropertyId,
  validateTransferId,
  validatePagination,
};
