# Bharat Registry - Automated Test Suite (PowerShell 5.1 compatible)

$ErrorActionPreference = "Stop"

Write-Host "`nBHARAT REGISTRY - COMPREHENSIVE TEST SUITE`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$global:testsTotal = 0
$global:testsPassed = 0
$global:testsFailed = 0

function Invoke-TestCase {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )

    $global:testsTotal++
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    Write-Host ("-" * 60)

    try {
        & $TestBlock
        $global:testsPassed++
        Write-Host "PASS: $Name`n" -ForegroundColor Green
        return $true
    }
    catch {
        $global:testsFailed++
        Write-Host "FAIL: $Name" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)`n" -ForegroundColor Red
        return $false
    }
}

Invoke-TestCase "Smart Contract Tests" {
    Write-Host "Running Hardhat tests..." -ForegroundColor Gray
    Push-Location blockchain
    try {
        $output = & npx hardhat test 2>&1
    }
    finally {
        Pop-Location
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Contract tests failed"
    }

    $passingLine = ($output | Select-String -Pattern "passing" | Select-Object -Last 1).Line
    if ($passingLine) {
        Write-Host $passingLine -ForegroundColor Green
    }
}

Invoke-TestCase "Contract Compilation" {
    Write-Host "Compiling contracts..." -ForegroundColor Gray
    Push-Location blockchain
    try {
        & npx hardhat compile --force 2>&1 | Out-Null
    }
    finally {
        Pop-Location
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Compilation failed"
    }

    if (-not (Test-Path "blockchain/artifacts/contracts/LandRegistry.sol/LandRegistry.json")) {
        throw "LandRegistry artifact not found"
    }
    if (-not (Test-Path "blockchain/artifacts/contracts/Transfer.sol/Transfer.json")) {
        throw "Transfer artifact not found"
    }

    Write-Host "LandRegistry and Transfer artifacts generated" -ForegroundColor Gray
}

Invoke-TestCase "Besu Configuration Files" {
    Write-Host "Checking Besu network configuration..." -ForegroundColor Gray

    $requiredFiles = @(
        "besu-network/config/genesis.json",
        "besu-network/config/node1.toml",
        "besu-network/config/node2.toml",
        "besu-network/config/node3.toml",
        "besu-network/start-network.ps1",
        "besu-network/stop-network.ps1"
    )

    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            throw "Missing file: $file"
        }
    }

    $genesis = Get-Content "besu-network/config/genesis.json" -Raw | ConvertFrom-Json
    if ($genesis.config.chainId -ne 1337) {
        throw "Invalid chain ID in genesis.json"
    }

    $node1Config = Get-Content "besu-network/config/node1.toml" -Raw
    if ($node1Config -notmatch "min-gas-price=0") {
        throw "Gas price not set to 0 in node1.toml"
    }

    Write-Host "Besu config checks passed" -ForegroundColor Gray
}

Invoke-TestCase "Deployment Scripts" {
    Write-Host "Checking deployment scripts..." -ForegroundColor Gray

    if (-not (Test-Path "blockchain/scripts/deploy-besu.js")) {
        throw "deploy-besu.js not found"
    }
    if (-not (Test-Path "blockchain/scripts/test-besu.js")) {
        throw "test-besu.js not found"
    }

    $deployScript = Get-Content "blockchain/scripts/deploy-besu.js" -Raw
    if ($deployScript -notmatch "gasPrice:\s*0") {
        throw "gasPrice not set to 0 in deploy-besu.js"
    }

    Write-Host "Deployment scripts look correct" -ForegroundColor Gray
}

Invoke-TestCase "Hardhat Configuration" {
    Write-Host "Checking Hardhat config..." -ForegroundColor Gray

    $hardhatConfig = Get-Content "blockchain/hardhat.config.js" -Raw

    if ($hardhatConfig -notmatch "besu:") {
        throw "Besu network not configured in hardhat.config.js"
    }
    if ($hardhatConfig -notmatch "chainId:\s*1337") {
        throw "Besu chain ID not set to 1337"
    }
    if ($hardhatConfig -notmatch "gasPrice:\s*0") {
        throw "Besu gas price not set to 0"
    }

    Write-Host "Hardhat config checks passed" -ForegroundColor Gray
}

Invoke-TestCase "Documentation Files" {
    Write-Host "Checking documentation..." -ForegroundColor Gray

    $requiredDocs = @(
        "IMPLEMENTATION_SUCCESS.md",
        "BESU_SETUP.md",
        "STARTUP_CHECKLIST.md",
        "QUICK_START.md",
        "ARCHITECTURE.md",
        "DOCUMENTATION_INDEX.md",
        "besu-network/README.md"
    )

    foreach ($doc in $requiredDocs) {
        if (-not (Test-Path $doc)) {
            throw "Missing documentation: $doc"
        }

        $lineCount = (Get-Content $doc | Measure-Object -Line).Lines
        Write-Host "$doc ($lineCount lines)" -ForegroundColor Gray
    }
}

Invoke-TestCase "Package.json Scripts" {
    Write-Host "Checking npm scripts..." -ForegroundColor Gray

    $package = Get-Content "package.json" -Raw | ConvertFrom-Json
    $requiredScripts = @("deploy:besu", "test:besu", "besu:start", "besu:stop")
    $scriptNames = @($package.scripts.PSObject.Properties.Name)

    foreach ($script in $requiredScripts) {
        if (-not ($scriptNames -contains $script)) {
            throw "Missing npm script: $script"
        }
    }

    Write-Host "Required npm scripts are configured" -ForegroundColor Gray
}

Write-Host "`nTesting: Besu Installation (Optional)" -ForegroundColor Yellow
Write-Host ("-" * 60)
$global:testsTotal++

try {
    $null = Get-Command besu -ErrorAction Stop
    $besuVersion = (& besu --version 2>&1 | Out-String).Trim()
    Write-Host "PASS: Besu is installed: $besuVersion" -ForegroundColor Green
    $global:testsPassed++
}
catch {
    Write-Host "WARN: Besu is not installed (optional)" -ForegroundColor Yellow
    Write-Host "Install from: https://github.com/hyperledger/besu/releases" -ForegroundColor Gray
    $global:testsPassed++
}

Write-Host "`n" ("=" * 60) -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nTotal Tests:  $global:testsTotal" -ForegroundColor White
Write-Host "Passed:       $global:testsPassed" -ForegroundColor Green
Write-Host "Failed:       $global:testsFailed" -ForegroundColor $(if ($global:testsFailed -eq 0) { "Green" } else { "Red" })

$passRate = [math]::Round(($global:testsPassed / $global:testsTotal) * 100, 1)
Write-Host "Pass Rate:    $passRate%" -ForegroundColor $(if ($passRate -eq 100) { "Green" } elseif ($passRate -ge 90) { "Yellow" } else { "Red" })

if ($global:testsFailed -eq 0) {
    Write-Host "`nALL TESTS PASSED" -ForegroundColor Green
}
else {
    Write-Host "`nSOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Red
    exit 1
}

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
