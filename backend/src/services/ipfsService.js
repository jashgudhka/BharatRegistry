const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class IPFSService {
  /**
   * Upload a file and compute its content hash
   * Simulates IPFS by storing files locally with SHA-256 content-addressable naming
   * @param {Buffer} buffer - File buffer
   * @param {string} originalName - Original filename
   * @returns {{ hash: string, path: string, size: number }}
   */
  async uploadFile(buffer, originalName) {
    // Compute SHA-256 content hash (simulates IPFS CID)
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Prefix with Qm to simulate IPFS CID format
    const ipfsHash = `Qm${hash.substring(0, 44)}`;

    // Get file extension
    const ext = path.extname(originalName);
    const filename = `${ipfsHash}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Write file
    fs.writeFileSync(filePath, buffer);

    return {
      hash: ipfsHash,
      path: filePath,
      size: buffer.length,
      filename,
    };
  }

  /**
   * Get a file by its hash
   * @param {string} hash - The content hash
   * @returns {Buffer|null}
   */
  getFile(hash) {
    const files = fs.readdirSync(UPLOAD_DIR);
    const match = files.find((f) => f.startsWith(hash));

    if (!match) return null;

    return fs.readFileSync(path.join(UPLOAD_DIR, match));
  }

  /**
   * Get file info by hash
   * @param {string} hash
   * @returns {{ exists: boolean, path: string|null, filename: string|null }}
   */
  getFileInfo(hash) {
    const files = fs.readdirSync(UPLOAD_DIR);
    const match = files.find((f) => f.startsWith(hash));

    if (!match) {
      return { exists: false, path: null, filename: null };
    }

    const filePath = path.join(UPLOAD_DIR, match);
    const stats = fs.statSync(filePath);

    return {
      exists: true,
      path: filePath,
      filename: match,
      size: stats.size,
    };
  }

  /**
   * Verify a document by recomputing its hash
   * @param {string} hash - Expected hash
   * @param {Buffer} buffer - File to verify
   * @returns {boolean}
   */
  verifyDocument(hash, buffer) {
    const computedHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");
    const expectedHex = hash.startsWith("Qm") ? hash.substring(2) : hash;
    return computedHash.startsWith(expectedHex);
  }
}

module.exports = new IPFSService();
