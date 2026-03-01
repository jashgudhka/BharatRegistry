# Bharat Registry - Automated Test Suite
# Run this script to test the entire project

Write-Host "`n🧪 BHARAT REGISTRY - COMPREHENSIVE TEST SUITE`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

$global:testsTotal = 0
$global:testsPassed = 0
$global:testsFailed = 0

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    $global:testsTotal++
    Write-Host "`n📋 Testing: $Name" -ForegroundColor Yellow
    Write-Host "-" * 60
    
    try {
        & $TestBlock
        $global:testsPassed++
        Write-Host "✅ PASS: $Name`n" -ForegroundColor Green
        return $true
    }
    catch {
        $global:testsFailed++
        Write-Host "❌ FAIL: $Name" -ForegroundColor Red
        Write-Host "Error: $_`n" -ForegroundColor Red
        return $false
    }
}

# Test 1: Smart Contract Tests
Test-Component "Smart Contract Tests" {
    Write-Host "Running Hardhat tests..." -ForegroundColor Gray
    cd blockchain
    $output = npx hardhat test 2>&1
    cd ..
    
    if ($LASTEXITCODE -ne 0) {
        throw "Contract tests failed"
    }
    
    # Count passed tests
    $passedCount = ($output | Select-String -Pattern "passing" | Out-String).Trim()
    Write-Host $passedCount -ForegroundColor Green
}

# Test 2: Contract Compilation
Test-Component "Contract Compilation" {
    Write-Host "Compiling contracts..." -ForegroundColor Gray
    cd blockchain
    npx hardhat compile --force 2>&1 | Out-Null
    cd ..
    
    if ($LASTEXITCODE -ne 0) {
        throw "Compilation failed"
    }
    
    # Check artifacts exist
    if (-not (Test-Path "blockchain/artifacts/contracts/LandRegistry.sol/LandRegistry.json")) {
        throw "LandRegistry artifact not found"
    }
    if (-not (Test-Path "blockchain/artifacts/contracts/Transfer.sol/Transfer.json")) {
        throw "Transfer artifact not found"
    }
    
    Write-Host "✓ LandRegistry compiled" -ForegroundColor Gray
    Write-Host "✓ Transfer compiled" -ForegroundColor Gray
}

# Test 3: Besu Configuration Files
Test-Component "Besu Configuration Files" {
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
        Write-Host "✓ $file exists" -ForegroundColor Gray
    }
    
    # Validate genesis.json
    $genesis = Get-Content "besu-network/config/genesis.json" | ConvertFrom-Json
    if ($genesis.config.chainId -ne 1337) {
        throw "Invalid chain ID in genesis.json"
    }
    Write-Host "✓ Genesis chain ID correct (1337)" -ForegroundColor Gray
    
    # Check gas price in node configs
    $node1Config = Get-Content "besu-network/config/node1.toml" -Raw
    if ($node1Config -notmatch "min-gas-price=0") {
        throw "Gas price not set to 0 in node1.toml"
    }
    Write-Host "✓ Node 1 gas price = 0" -ForegroundColor Gray
}

# Test 4: Deployment Scripts
Test-Component "Deployment Scripts" {
    Write-Host "Checking deployment scripts..." -ForegroundColor Gray
    
    if (-not (Test-Path "blockchain/scripts/deploy-besu.js")) {
        throw "deploy-besu.js not found"
    }
    if (-not (Test-Path "blockchain/scripts/test-besu.js")) {
        throw "test-besu.js not found"
    }
    
    # Check if gasPrice: 0 is set in deployment script
    $deployScript = Get-Content "blockchain/scripts/deploy-besu.js" -Raw
    if ($deployScript -notmatch "gasPrice:\s*0") {
        throw "gasPrice not set to 0 in deploy-besu.js"
    }
    
    Write-Host "✓ deploy-besu.js exists and configured" -ForegroundColor Gray
    Write-Host "✓ test-besu.js exists" -ForegroundColor Gray
}

# Test 5: Hardhat Configuration
Test-Component "Hardhat Configuration" {
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
    
    Write-Host "✓ Besu network configured" -ForegroundColor Gray
    Write-Host "✓ Chain ID: 1337" -ForegroundColor Gray
    Write-Host "✓ Gas Price: 0" -ForegroundColor Gray
}

# Test 6: Documentation
Test-Component "Documentation Files" {
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
        Write-Host "✓ $doc ($lineCount lines)" -ForegroundColor Gray
    }
}

# Test 7: Package Scripts
Test-Component "Package.json Scripts" {
    Write-Host "Checking npm scripts..." -ForegroundColor Gray
    
    $package = Get-Content "package.json" | ConvertFrom-Json
    
    $requiredScripts = @("deploy:besu", "test:besu", "besu:start", "besu:stop")
    
    foreach ($script in $requiredScripts) {
        if (-not $package.scripts.$script) {
            throw "Missing npm script: $script"
        }
        Write-Host "✓ npm run $script configured" -ForegroundColor Gray
    }
}

# Test 8: Check Besu Installation (informational)
Write-Host "`n📋 Testing: Besu Installation (Optional)" -ForegroundColor Yellow
Write-Host ("-" * 60)
$global:testsTotal++

$besuInstalled = $false
try {
    $null = Get-Command besu -ErrorAction Stop
    $besuVersion = besu --version 2>&1 | Out-String
    Write-Host "✅ Besu is installed: $($besuVersion.Trim())" -ForegroundColor Green
    $global:testsPassed++
    $besuInstalled = $true
    
    Write-Host "`n🚀 You can now run the full test suite:" -ForegroundColor Cyan
    Write-Host "   1. Start network: .\besu-network\start-network.ps1" -ForegroundColor White
    Write-Host "   2. Deploy: npm run deploy:besu" -ForegroundColor White
    Write-Host "   3. Test: npm run test:besu`n" -ForegroundColor White
}
catch {
    Write-Host "⚠️  Besu not installed (optional)" -ForegroundColor Yellow
    Write-Host "   Install from: https://github.com/hyperledger/besu/releases" -ForegroundColor Gray
    Write-Host "   Then run: .\besu-network\start-network.ps1`n" -ForegroundColor Gray
}

# Test Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`nTotal Tests:  $global:testsTotal" -ForegroundColor White
Write-Host "Passed:       $global:testsPassed" -ForegroundColor Green
Write-Host "Failed:       $global:testsFailed" -ForegroundColor $(if ($global:testsFailed -eq 0) { "Green" } else { "Red" })

$passRate = [math]::Round(($global:testsPassed / $global:testsTotal) * 100, 1)
Write-Host "Pass Rate:    $passRate%" -ForegroundColor $(if ($passRate -eq 100) { "Green" } elseif ($passRate -ge 90) { "Yellow" } else { "Red" })

if ($global:testsFailed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! PROJECT IS READY!" -ForegroundColor Green
    Write-Host "`n📚 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Read: IMPLEMENTATION_SUCCESS.md" -ForegroundColor White
    Write-Host "   2. Follow: BESU_SETUP.md" -ForegroundColor White
    Write-Host "   3. Start: .\besu-network\start-network.ps1`n" -ForegroundColor White
}
else {
    Write-Host "`n⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE" -ForegroundColor Red
    exit 1
}

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
