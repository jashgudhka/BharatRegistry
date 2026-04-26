const crypto = require("crypto");

// ============================================================
// Verhoeff Algorithm for Aadhaar Validation
// ============================================================

// Multiplication table d
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Permutation table p
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Verhoeff checksum validation
 * Used to validate Aadhaar numbers
 * @param {string} num - The number string to validate
 * @returns {boolean} True if the checksum is valid
 */
function verhoeffValidate(num) {
  let c = 0;
  const myArray = stringToReversedIntArray(num);

  for (let i = 0; i < myArray.length; i++) {
    c = d[c][p[i % 8][myArray[i]]];
  }

  return c === 0;
}

function stringToReversedIntArray(num) {
  let myArray = [];
  for (let i = 0; i < num.length; i++) {
    myArray.push(parseInt(num.charAt(i), 10));
  }
  myArray.reverse();
  return myArray;
}

// ============================================================
// Aadhaar Validation
// ============================================================

/**
 * Validate Aadhaar number format and checksum
 * Aadhaar: 12-digit number, cannot start with 0 or 1
 * Uses Verhoeff algorithm for checksum validation
 * @param {string} aadhaar - The Aadhaar number to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateAadhaar(aadhaar) {
  if (!aadhaar || typeof aadhaar !== "string") {
    return { valid: false, error: "Aadhaar number is required" };
  }

  // Remove spaces
  const cleaned = aadhaar.replace(/\s/g, "");

  // Must be exactly 16 digits
  if (!/^\d{16}$/.test(cleaned)) {
    return {
      valid: false,
      error: "Aadhaar number must be exactly 16 digits",
    };
  }

  // Cannot start with 0 or 1
  if (cleaned[0] === "0" || cleaned[0] === "1") {
    return {
      valid: false,
      error: "Aadhaar number cannot start with 0 or 1",
    };
  }

  const checksumValidationEnabled =
    String(process.env.ENABLE_AADHAAR_CHECKSUM || "false").toLowerCase() ===
    "true";

  // Verhoeff checksum validation (optional via env)
  if (checksumValidationEnabled && !verhoeffValidate(cleaned)) {
    return {
      valid: false,
      error: "Invalid Aadhaar number (checksum failed)",
    };
  }

  return { valid: true, error: null };
}

// ============================================================
// PAN Validation
// ============================================================

/**
 * Validate PAN card number format
 * Format: ABCDE1234F
 * - First 3 chars: A-Z (alphabetic series)
 * - 4th char: C=Company, P=Person, H=HUF, F=Firm, A=AOP, T=Trust, etc.
 * - 5th char: First letter of surname (for individuals)
 * - Next 4 chars: Sequential digits 0001-9999
 * - Last char: Alphabetic check digit
 * @param {string} pan - The PAN number to validate
 * @returns {{ valid: boolean, error: string|null, type: string|null }}
 */
function validatePAN(pan) {
  if (!pan || typeof pan !== "string") {
    return { valid: false, error: "PAN number is required", type: null };
  }

  const cleaned = pan.trim().toUpperCase();

  // Must be exactly 10 characters
  if (cleaned.length !== 10) {
    return {
      valid: false,
      error: "PAN number must be exactly 10 characters",
      type: null,
    };
  }

  // Format: AAAAA9999A
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (!panRegex.test(cleaned)) {
    return {
      valid: false,
      error:
        "Invalid PAN format. Must be 5 letters, 4 digits, and 1 letter (e.g., ABCDE1234F)",
      type: null,
    };
  }

  // 4th character determines entity type
  const entityTypes = {
    A: "Association of Persons (AOP)",
    B: "Body of Individuals (BOI)",
    C: "Company",
    F: "Firm",
    G: "Government",
    H: "Hindu Undivided Family (HUF)",
    L: "Local Authority",
    J: "Artificial Juridical Person",
    P: "Individual (Person)",
    T: "Trust",
  };

  const fourthChar = cleaned[3];
  const type = entityTypes[fourthChar];

  if (!type) {
    return {
      valid: false,
      error: `Invalid entity type character '${fourthChar}' at position 4`,
      type: null,
    };
  }

  return { valid: true, error: null, type };
}

// ============================================================
// Aadhaar Hashing
// ============================================================

/**
 * Hash Aadhaar number for secure storage
 * Uses SHA-256 with a salt for additional security
 * @param {string} aadhaar - The raw Aadhaar number
 * @returns {string} Hashed Aadhaar
 */
function hashAadhaar(aadhaar) {
  const cleaned = aadhaar.replace(/\s/g, "");
  const salt = process.env.AADHAAR_HASH_SALT || "bharat-registry-salt";
  return crypto
    .createHash("sha256")
    .update(cleaned + salt)
    .digest("hex");
}

/**
 * Validate Indian phone number
 * @param {string} phone
 * @returns {{ valid: boolean, error: string|null }}
 */
function validatePhone(phone) {
  if (!phone) return { valid: false, error: "Phone number is required" };
  const cleaned = phone.replace(/[\s\-\+]/g, "");
  // Indian mobile: 10 digits starting with 6-9, or +91 prefix
  const regex = /^(91)?[6-9]\d{9}$/;
  if (!regex.test(cleaned)) {
    return {
      valid: false,
      error: "Invalid Indian phone number. Must be 10 digits starting with 6-9",
    };
  }
  return { valid: true, error: null };
}

/**
 * Validate Indian pincode
 * @param {string} pincode
 * @returns {{ valid: boolean, error: string|null }}
 */
function validatePincode(pincode) {
  if (!pincode) return { valid: false, error: "Pincode is required" };
  const regex = /^[1-9][0-9]{5}$/;
  if (!regex.test(pincode)) {
    return {
      valid: false,
      error: "Invalid pincode. Must be 6 digits and cannot start with 0",
    };
  }
  return { valid: true, error: null };
}

module.exports = {
  validateAadhaar,
  validatePAN,
  hashAadhaar,
  validatePhone,
  validatePincode,
  verhoeffValidate,
};
