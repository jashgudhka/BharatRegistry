# ============================================================================
# BHARAT REGISTRY - ECOSYSTEM WORKFLOWS GUIDED DEMO
# ============================================================================
# This script orchestrates a complete end-to-end demonstration of the
# six ecosystem workflows (Document, Identity, Mortgage, Dispute, Insurance, Token)
# on a local Besu network.
#
# Usage:
#   .\ECOSYSTEM_DEMO.ps1                    # Full demo with all steps
#   .\ECOSYSTEM_DEMO.ps1 -SkipNetwork       # Skip Besu checks, assume running
#   .\ECOSYSTEM_DEMO.ps1 -DeployOnly        # Deploy contracts, skip tests
#   .\ECOSYSTEM_DEMO.ps1 -TestOnly          # Run tests only (assume deployed)
#
# ============================================================================

param(
    [switch]$SkipNetwork = $false,
    [switch]$DeployOnly = $false,
    [switch]$TestOnly = $false,
    [switch]$Help = $false
)

# Color constants for output
$Colors = @{
    Header    = 'Cyan'
    Success   = 'Green'
    Warning   = 'Yellow'
    Error     = 'Red'
    Info      = 'White'
    Step      = 'Magenta'
}

function Write-Step {
    param([string]$Message, [int]$Number = 0)
    $prefix = if ($Number -gt 0) { "[$Number]" } else { ">" }
    Write-Host "$prefix $Message" -ForegroundColor $Colors.Step
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor $Colors.Success
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $Colors.Warning
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Error
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    $border = "-" * ($Title.Length + 4)
    Write-Host $border -ForegroundColor $Colors.Header
    Write-Host "  $Title  " -ForegroundColor $Colors.Header
    Write-Host $border -ForegroundColor $Colors.Header
    Write-Host ""
}

function Test-Prerequisites {
    Write-Header "CHECKING PREREQUISITES"
    
    $missing = @()
    
    # Check Node.js
    Write-Step "Checking Node.js..." 1
    $node = node --version
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js $node detected"
    } else {
        $missing += "Node.js"
    }
    
    # Check npm
    Write-Step "Checking npm..." 2
    $npm = npm --version
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm $npm detected"
    } else {
        $missing += "npm"
    }
    
    # Check git
    Write-Step "Checking git..." 3
    $git = git --version
    if ($LASTEXITCODE -eq 0) {
        Write-Success "git detected"
    } else {
        $missing += "git"
    }
    
    if ($missing.Count -gt 0) {
        Write-Error-Custom "Missing prerequisites: $($missing -join ', ')"
        exit 1
    }
    
    Write-Success "All prerequisites satisfied"
}

function Test-BesuNetwork {
    Write-Header "CHECKING BESU NETWORK"
    
    Write-Step "Probing Besu RPC endpoint (http://127.0.0.1:8545)..." 1
    
    $maxRetries = 3
    $retries = 0
    
    while ($retries -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" `
                -Method POST `
                -Headers @{"Content-Type" = "application/json"} `
                -Body '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' `
                -TimeoutSec 2 `
                -ErrorAction Stop
            
            $result = $response.Content | ConvertFrom-Json
            if ($result.result) {
                Write-Success "Besu network is ONLINE and responding (Chain: $($result.result))"
                return $true
            }
        } catch {
            $retries++
            if ($retries -lt $maxRetries) {
                Write-Warning "Attempt $retries/$maxRetries failed, retrying in 1 second..."
                Start-Sleep -Seconds 1
            }
        }
    }
    
    Write-Error-Custom "Besu network is OFFLINE"
    Write-Host ""
    Write-Host "To start Besu network, run:" -ForegroundColor $Colors.Info
    Write-Host "  cd besu-network" -ForegroundColor $Colors.Info
    Write-Host "  .\start-network.ps1" -ForegroundColor $Colors.Info
    Write-Host ""
    
    return $false
}

function Install-Dependencies {
    Write-Header "INSTALLING DEPENDENCIES"
    
    Write-Step "Installing blockchain dependencies..." 1
    Push-Location blockchain
    npm install 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Blockchain dependencies installed"
    } else {
        Write-Error-Custom "Failed to install blockchain dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Step "Installing backend dependencies..." 2
    Push-Location backend
    npm install 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend dependencies installed"
    } else {
        Write-Error-Custom "Failed to install backend dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Step "Installing frontend dependencies..." 3
    Push-Location frontend
    npm install 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend dependencies installed"
    } else {
        Write-Error-Custom "Failed to install frontend dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
}

function Deploy-Contracts {
    Write-Header "DEPLOYING SMART CONTRACTS"
    
    Write-Step "Compiling contracts..." 1
    Push-Location blockchain
    npm run compile 2>&1 | Select-Object -Last 20
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Contract compilation failed"
        Pop-Location
        exit 1
    }
    Write-Success "Contracts compiled successfully"
    
    Write-Step "Deploying to Besu network..." 2
    Write-Host ""
    npm run deploy-besu
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Deployment failed"
        Pop-Location
        exit 1
    }
    Write-Success "Contracts deployed successfully"
    Pop-Location
}

function Run-Tests {
    Write-Header "RUNNING ECOSYSTEM WORKFLOW TESTS"
    
    Write-Step "Executing comprehensive test suite..." 1
    Write-Host "Tests will verify all six workflows:" -ForegroundColor $Colors.Info
    Write-Host "  1. Document Registry workflow" -ForegroundColor $Colors.Info
    Write-Host "  2. Identity Registry workflow" -ForegroundColor $Colors.Info
    Write-Host "  3. Mortgage Registry workflow" -ForegroundColor $Colors.Info
    Write-Host "  4. Dispute Resolution workflow" -ForegroundColor $Colors.Info
    Write-Host "  5. Title Insurance workflow" -ForegroundColor $Colors.Info
    Write-Host "  6. Property Token workflow" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Push-Location blockchain
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Tests failed"
        Pop-Location
        exit 1
    }
    Write-Success "All tests passed!"
    Pop-Location
}

function Show-Deployment-Summary {
    Write-Header "DEPLOYMENT SUMMARY"
    
    Write-Host "Smart Contracts Deployed:" -ForegroundColor $Colors.Header
    Write-Host "  • DocumentRegistry - Document authenticity verification" -ForegroundColor $Colors.Info
    Write-Host "  • IdentityRegistry - KYC and accredited roles" -ForegroundColor $Colors.Info
    Write-Host "  • MortgageRegistry - Lien and encumbrance tracking" -ForegroundColor $Colors.Info
    Write-Host "  • DisputeResolution - Dispute management and blocking logic" -ForegroundColor $Colors.Info
    Write-Host "  • TitleInsurance - Policy issuance and claims" -ForegroundColor $Colors.Info
    Write-Host "  • PropertyToken - Fractional ownership via ERC1155" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "Integration Points:" -ForegroundColor $Colors.Header
    Write-Host "  • Transfer contract now checks MortgageRegistry encumbrances" -ForegroundColor $Colors.Info
    Write-Host "  • Transfer contract now checks DisputeResolution blocks" -ForegroundColor $Colors.Info
    Write-Host "  • Compliance gates prevent invalid transfers automatically" -ForegroundColor $Colors.Info
    Write-Host ""
}

function Show-Next-Steps {
    Write-Header "NEXT STEPS"
    
    Write-Host "1. Start the Backend API:" -ForegroundColor $Colors.Header
    Write-Host "   cd backend" -ForegroundColor $Colors.Info
    Write-Host "   npm start" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "2. Start the Frontend UI:" -ForegroundColor $Colors.Header
    Write-Host "   cd frontend" -ForegroundColor $Colors.Info
    Write-Host "   npm run dev" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "3. Access the Ecosystem Workbench:" -ForegroundColor $Colors.Header
    Write-Host "   http://localhost:5173/ecosystem-workbench" -ForegroundColor $Colors.Info
    Write-Host ""
    
    Write-Host "4. Available API Endpoints:" -ForegroundColor $Colors.Header
    Write-Host "   POST /api/ecosystem/documents/register" -ForegroundColor $Colors.Info
    Write-Host "   POST /api/ecosystem/identity/submit" -ForegroundColor $Colors.Info
    Write-Host "   POST /api/ecosystem/mortgage/lien/create" -ForegroundColor $Colors.Info
    Write-Host "   POST /api/ecosystem/dispute/open" -ForegroundColor $Colors.Info
    Write-Host "   POST /api/ecosystem/insurance/policy/issue" -ForegroundColor $Colors.Info
    Write-Host "   POST /api/ecosystem/token/tokenize" -ForegroundColor $Colors.Info
    Write-Host ""
}

function Show-Help {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor $Colors.Header
    Write-Host "                 ECOSYSTEM DEMO SCRIPT - USAGE GUIDE                    " -ForegroundColor $Colors.Header
    Write-Host "========================================================================" -ForegroundColor $Colors.Header
    Write-Host ""
    Write-Host "SYNOPSIS" -ForegroundColor $Colors.Header
    Write-Host "  Orchestrates a complete end-to-end demonstration of the Bharat Registry"
    Write-Host "  ecosystem workflows on a local Besu network."
    Write-Host ""
    Write-Host "USAGE" -ForegroundColor $Colors.Header
    Write-Host "  .\ECOSYSTEM_DEMO.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS" -ForegroundColor $Colors.Header
    Write-Host "  -Help              Show this help message"
    Write-Host "  -SkipNetwork       Skip Besu network checks (assume already running)"
    Write-Host "  -DeployOnly        Deploy contracts only, skip tests"
    Write-Host "  -TestOnly          Run tests only (assume contracts already deployed)"
    Write-Host ""
    Write-Host "EXAMPLES" -ForegroundColor $Colors.Header
    Write-Host "  # Full demo: check network, install deps, deploy, run tests"
    Write-Host "  .\ECOSYSTEM_DEMO.ps1"
    Write-Host ""
    Write-Host "  # Quick test run (network already up, contracts deployed)"
    Write-Host "  .\ECOSYSTEM_DEMO.ps1 -SkipNetwork -TestOnly"
    Write-Host ""
    Write-Host "  # Deploy new contracts without running tests"
    Write-Host "  .\ECOSYSTEM_DEMO.ps1 -SkipNetwork -DeployOnly"
    Write-Host ""
    Write-Host "WORKFLOWS DEMONSTRATED" -ForegroundColor $Colors.Header
    Write-Host "  1. Document Registry - Register, verify, and check authenticity"
    Write-Host "  2. Identity Registry - Submit KYC, review, and grant roles"
    Write-Host "  3. Mortgage Registry - Create liens, update balance, prevent transfers"
    Write-Host "  4. Dispute Resolution - Open, review, resolve, block transfers"
    Write-Host "  5. Title Insurance - Fund reserve, issue policies, pay claims"
    Write-Host "  6. Property Token - Tokenize, distribute, and track fractional ownership"
    Write-Host ""
    Write-Host "REQUIREMENTS" -ForegroundColor $Colors.Header
    Write-Host "  - Node.js v18+"
    Write-Host "  - npm v9+"
    Write-Host "  - Git"
    Write-Host "  - Besu network running on http://127.0.0.1:8545"
    Write-Host ""
    Write-Host "STARTING BESU NETWORK" -ForegroundColor $Colors.Header
    Write-Host "  cd besu-network"
    Write-Host "  .\start-network.ps1"
    Write-Host ""
    Write-Host "TROUBLESHOOTING" -ForegroundColor $Colors.Header
    Write-Host "  Q: Besu network is OFFLINE"
    Write-Host "  A: Start Besu with: cd besu-network && .\start-network.ps1"
    Write-Host ""
    Write-Host "  Q: Tests failed"
    Write-Host "  A: Check that contracts deployed successfully and Besu is responding"
    Write-Host ""
    Write-Host "  Q: npm install fails"
    Write-Host "  A: Try: npm cache clean --force && npm install"
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if ($Help) {
    Show-Help
    exit 0
}

Write-Host ""
Write-Header "BHARAT REGISTRY - ECOSYSTEM WORKFLOWS DEMO"

# Always check prerequisites
Test-Prerequisites

# Check network unless skipped
if (-not $SkipNetwork) {
    if (-not (Test-BesuNetwork)) {
        Write-Error-Custom "Cannot proceed without Besu network. Exiting."
        exit 1
    }
}

# Install dependencies
Install-Dependencies

# Deploy unless TestOnly
if (-not $TestOnly) {
    Deploy-Contracts
    Show-Deployment-Summary
}

# Run tests unless DeployOnly
if (-not $DeployOnly) {
    Run-Tests
}

# Show next steps
Show-Next-Steps

Write-Header "DEMO COMPLETE"
Write-Host "Ecosystem workflows are now live and tested on your local node!" -ForegroundColor $Colors.Success
Write-Host ""
