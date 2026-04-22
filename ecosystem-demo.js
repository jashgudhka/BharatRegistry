#!/usr/bin/env node
/**
 * ============================================================================
 * BHARAT REGISTRY - ECOSYSTEM DEMO ORCHESTRATOR (Node.js)
 * ============================================================================
 *
 * Orchestrates a complete end-to-end demonstration of ecosystem workflows.
 * Cross-platform alternative to PowerShell script.
 *
 * Usage:
 *   node ecosystem-demo.js                    # Full demo
 *   node ecosystem-demo.js --skip-network     # Skip network checks
 *   node ecosystem-demo.js --deploy-only      # Deploy only
 *   node ecosystem-demo.js --test-only        # Test only
 *   node ecosystem-demo.js --help             # Show help
 *
 * ============================================================================
 */

const { execSync, spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const COLORS = {
  reset: "\x1b[0m",
  header: "\x1b[36m", // Cyan
  success: "\x1b[32m", // Green
  warning: "\x1b[33m", // Yellow
  error: "\x1b[31m", // Red
  info: "\x1b[37m", // White
  step: "\x1b[35m", // Magenta
};

const CONFIG = {
  besuRpcUrl: "http://127.0.0.1:8545",
  besuTimeout: 2000,
  networkRetries: 3,
  dirs: {
    root: process.cwd(),
    blockchain: path.join(process.cwd(), "blockchain"),
    backend: path.join(process.cwd(), "backend"),
    frontend: path.join(process.cwd(), "frontend"),
  },
};

// ============================================================================
// OUTPUT UTILITIES
// ============================================================================

function log(message, color = COLORS.info) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logStep(message, number = null) {
  const prefix = number ? `[${number}]` : "→";
  log(`${prefix} ${message}`, COLORS.step);
}

function logSuccess(message) {
  log(`✓ ${message}`, COLORS.success);
}

function logWarning(message) {
  log(`⚠ ${message}`, COLORS.warning);
}

function logError(message) {
  log(`✗ ${message}`, COLORS.error);
}

function logHeader(title) {
  const border = "═".repeat(title.length + 2);
  console.log();
  log(`╔${border}╗`, COLORS.header);
  log(`║ ${title} ║`, COLORS.header);
  log(`╚${border}╝`, COLORS.header);
  console.log();
}

// ============================================================================
// UTILITIES
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    help: args.includes("--help") || args.includes("-h"),
    skipNetwork: args.includes("--skip-network"),
    deployOnly: args.includes("--deploy-only"),
    testOnly: args.includes("--test-only"),
  };
}

function runCommand(command, cwd = process.cwd(), silent = false) {
  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf-8",
      stdio: silent ? "pipe" : "inherit",
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// PREREQUISITE CHECKS
// ============================================================================

function checkPrerequisites() {
  logHeader("CHECKING PREREQUISITES");

  const checks = [
    { name: "Node.js", cmd: "node --version" },
    { name: "npm", cmd: "npm --version" },
    { name: "git", cmd: "git --version" },
  ];

  const missing = [];

  checks.forEach((check, idx) => {
    logStep(`Checking ${check.name}...`, idx + 1);
    const result = runCommand(check.cmd, process.cwd(), true);
    if (result.success) {
      logSuccess(`${check.name} ${result.output.trim()}`);
    } else {
      missing.push(check.name);
    }
  });

  if (missing.length > 0) {
    logError(`Missing prerequisites: ${missing.join(", ")}`);
    process.exit(1);
  }

  logSuccess("All prerequisites satisfied");
}

// ============================================================================
// NETWORK CHECKS
// ============================================================================

function checkBesuNetwork() {
  return new Promise(async (resolve) => {
    logHeader("CHECKING BESU NETWORK");
    logStep(`Probing Besu RPC endpoint (${CONFIG.besuRpcUrl})...`, 1);

    let retries = 0;
    const maxRetries = CONFIG.networkRetries;

    while (retries < maxRetries) {
      try {
        const data = JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1,
        });

        const req = http.request(CONFIG.besuRpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
          },
          timeout: CONFIG.besuTimeout,
        });

        req.on("response", (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const result = JSON.parse(body);
              if (result.result) {
                logSuccess(`Besu network is ONLINE (Chain: ${result.result})`);
                resolve(true);
              } else {
                throw new Error("Invalid response");
              }
            } catch {
              if (retries < maxRetries - 1) {
                logWarning(
                  `Attempt ${retries + 1}/${maxRetries} failed, retrying...`,
                );
                retries++;
                setTimeout(() => checkBesuNetwork(), 1000);
              } else {
                resolve(false);
              }
            }
          });
        });

        req.on("error", () => {
          retries++;
          if (retries < maxRetries) {
            logWarning(
              `Attempt ${retries}/${maxRetries} failed, retrying in 1 second...`,
            );
            setTimeout(() => checkBesuNetwork(), 1000);
          } else {
            resolve(false);
          }
        });

        req.write(data);
        req.end();
      } catch (error) {
        resolve(false);
      }
    }

    if (retries >= maxRetries) {
      logError("Besu network is OFFLINE");
      console.log();
      log("To start Besu network, run:", COLORS.info);
      log("  cd besu-network", COLORS.info);
      log(
        "  npm run start:besu  (or ./start-network.ps1 on Windows)",
        COLORS.info,
      );
      console.log();
      resolve(false);
    }
  });
}

// ============================================================================
// INSTALLATION
// ============================================================================

function installDependencies() {
  logHeader("INSTALLING DEPENDENCIES");

  const packages = [
    { name: "blockchain", dir: CONFIG.dirs.blockchain, num: 1 },
    { name: "backend", dir: CONFIG.dirs.backend, num: 2 },
    { name: "frontend", dir: CONFIG.dirs.frontend, num: 3 },
  ];

  packages.forEach((pkg) => {
    logStep(`Installing ${pkg.name} dependencies...`, pkg.num);
    const result = runCommand("npm install", pkg.dir, true);
    if (result.success) {
      logSuccess(`${pkg.name} dependencies installed`);
    } else {
      logError(`Failed to install ${pkg.name} dependencies`);
      process.exit(1);
    }
  });
}

// ============================================================================
// DEPLOYMENT
// ============================================================================

function deployContracts() {
  logHeader("DEPLOYING SMART CONTRACTS");

  // Compile
  logStep("Compiling contracts...", 1);
  let result = runCommand("npm run compile", CONFIG.dirs.blockchain, true);
  if (!result.success) {
    logError("Contract compilation failed");
    process.exit(1);
  }
  logSuccess("Contracts compiled successfully");

  // Deploy
  logStep("Deploying to Besu network...", 2);
  console.log();
  result = runCommand("npm run deploy-besu", CONFIG.dirs.blockchain);
  if (!result.success) {
    logError("Deployment failed");
    process.exit(1);
  }
  logSuccess("Contracts deployed successfully");
}

// ============================================================================
// TESTING
// ============================================================================

function runTests() {
  logHeader("RUNNING ECOSYSTEM WORKFLOW TESTS");

  logStep("Executing comprehensive test suite...", 1);
  log("Tests will verify all six workflows:", COLORS.info);
  log("  1. Document Registry workflow", COLORS.info);
  log("  2. Identity Registry workflow", COLORS.info);
  log("  3. Mortgage Registry workflow", COLORS.info);
  log("  4. Dispute Resolution workflow", COLORS.info);
  log("  5. Title Insurance workflow", COLORS.info);
  log("  6. Property Token workflow", COLORS.info);
  console.log();

  const result = runCommand("npm test", CONFIG.dirs.blockchain);
  if (!result.success) {
    logError("Tests failed");
    process.exit(1);
  }

  logSuccess("All tests passed!");
}

// ============================================================================
// SUMMARY & NEXT STEPS
// ============================================================================

function showDeploymentSummary() {
  logHeader("DEPLOYMENT SUMMARY");

  log("Smart Contracts Deployed:", COLORS.header);
  log("  • DocumentRegistry - Document authenticity verification", COLORS.info);
  log("  • IdentityRegistry - KYC and accredited roles", COLORS.info);
  log("  • MortgageRegistry - Lien and encumbrance tracking", COLORS.info);
  log(
    "  • DisputeResolution - Dispute management and blocking logic",
    COLORS.info,
  );
  log("  • TitleInsurance - Policy issuance and claims", COLORS.info);
  log("  • PropertyToken - Fractional ownership via ERC1155", COLORS.info);
  console.log();

  log("Integration Points:", COLORS.header);
  log(
    "  • Transfer contract checks MortgageRegistry encumbrances",
    COLORS.info,
  );
  log("  • Transfer contract checks DisputeResolution blocks", COLORS.info);
  log(
    "  • Compliance gates prevent invalid transfers automatically",
    COLORS.info,
  );
  console.log();
}

function showNextSteps() {
  logHeader("NEXT STEPS");

  log("1. Start the Backend API:", COLORS.header);
  log("   cd backend", COLORS.info);
  log("   npm start", COLORS.info);
  console.log();

  log("2. Start the Frontend UI:", COLORS.header);
  log("   cd frontend", COLORS.info);
  log("   npm run dev", COLORS.info);
  console.log();

  log("3. Access the Ecosystem Workbench:", COLORS.header);
  log("   http://localhost:5173/ecosystem-workbench", COLORS.info);
  console.log();

  log("4. Available API Endpoints:", COLORS.header);
  log("   POST /api/ecosystem/documents/register", COLORS.info);
  log("   POST /api/ecosystem/identity/submit", COLORS.info);
  log("   POST /api/ecosystem/mortgage/lien/create", COLORS.info);
  log("   POST /api/ecosystem/dispute/open", COLORS.info);
  log("   POST /api/ecosystem/insurance/policy/issue", COLORS.info);
  log("   POST /api/ecosystem/token/tokenize", COLORS.info);
  console.log();
}

function showHelp() {
  const helpText = `
╔════════════════════════════════════════════════════════════════════════════╗
║                   ECOSYSTEM DEMO SCRIPT - USAGE GUIDE                      ║
╚════════════════════════════════════════════════════════════════════════════╝

SYNOPSIS
  Orchestrates a complete end-to-end demonstration of the Bharat Registry
  ecosystem workflows on a local Besu network.

USAGE
  node ecosystem-demo.js [OPTIONS]

OPTIONS
  --help              Show this help message
  --skip-network      Skip Besu network checks (assume already running)
  --deploy-only       Deploy contracts only, skip tests
  --test-only         Run tests only (assume contracts already deployed)

EXAMPLES
  # Full demo: check network, install deps, deploy, run tests
  node ecosystem-demo.js

  # Quick test run (network already up, contracts deployed)
  node ecosystem-demo.js --skip-network --test-only

  # Deploy new contracts without running tests
  node ecosystem-demo.js --skip-network --deploy-only

WORKFLOWS DEMONSTRATED
  1. Document Registry
     - Register document hash
     - Verify document authenticity
     - Check verification status

  2. Identity Registry
     - Submit KYC identity information
     - Review and approve identity
     - Grant accredited roles

  3. Mortgage Registry
     - Create lien on property
     - Update outstanding balance
     - Prevent transfers on encumbered properties

  4. Dispute Resolution
     - Open dispute with evidence
     - Move to review state
     - Resolve with outcome determination
     - Block property transfers during disputes

  5. Title Insurance
     - Fund reserve pool
     - Issue policies
     - Pay claims on fraud-confirmed disputes
     - Track locked coverage

  6. Property Token
     - Tokenize property for fractional ownership
     - Track share balances
     - Calculate ownership percentages
     - Transfer fractional shares

REQUIREMENTS
  - Node.js v18+
  - npm v9+
  - Git
  - Besu network running on http://127.0.0.1:8545

STARTING BESU NETWORK
  cd besu-network
  npm run start:besu

OUTPUT
  The script generates detailed output showing:
  - Prerequisite checks
  - Network connectivity verification
  - Dependency installation status
  - Contract compilation details
  - Deployment addresses and confirmations
  - Test execution with workflow verification
  - Deployment summary
  - Next steps for interaction

TROUBLESHOOTING
  Q: "Besu network is OFFLINE"
     A: Start Besu with: cd besu-network && npm run start:besu

  Q: "Tests failed"
     A: Check that contracts deployed successfully and Besu is responding

  Q: "npm install fails"
     A: Try: npm cache clean --force && npm install

`;
  log(helpText, COLORS.info);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  console.log();
  logHeader("BHARAT REGISTRY - ECOSYSTEM WORKFLOWS DEMO");

  // Always check prerequisites
  checkPrerequisites();

  // Check network unless skipped
  if (!args.skipNetwork) {
    const networkOk = await checkBesuNetwork();
    if (!networkOk) {
      logError("Cannot proceed without Besu network. Exiting.");
      process.exit(1);
    }
  }

  // Install dependencies
  installDependencies();

  // Deploy unless TestOnly
  if (!args.testOnly) {
    deployContracts();
    showDeploymentSummary();
  }

  // Run tests unless DeployOnly
  if (!args.deployOnly) {
    runTests();
  }

  // Show next steps
  showNextSteps();

  logHeader("DEMO COMPLETE ✓");
  logSuccess("Ecosystem workflows are now live and tested on your local node!");
  console.log();
}

main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
