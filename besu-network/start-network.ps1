# Bharat Registry - Besu Permissioned Network Startup Script (Windows)
# This script starts a 3-node IBFT 2.0 validator network with ZERO GAS FEES

Write-Host "[i] Starting Bharat Registry Besu Network (Zero Gas)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Check if Besu is installed
if (-not (Get-Command besu -ErrorAction SilentlyContinue)) {
    Write-Host "[x] Besu is not installed." -ForegroundColor Red
    Write-Host "Please download from: https://github.com/hyperledger/besu/releases" -ForegroundColor Yellow
    Write-Host "Extract to C:\Program Files\Besu and add to PATH" -ForegroundColor Yellow
    exit 1
}

# Create directories
New-Item -ItemType Directory -Force -Path data\node1, data\node2, data\node3, logs | Out-Null

# Start Node 1
Write-Host "[+] Starting Node 1 (Port 8545)..." -ForegroundColor Cyan
Start-Process -FilePath "besu" -ArgumentList "--config-file=config\node1.toml" -RedirectStandardOutput "logs\node1.log" -RedirectStandardError "logs\node1-error.log" -WindowStyle Hidden
Start-Sleep -Seconds 3

# Get Node 1 enode
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8545" -Method Post -Body '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' -ContentType "application/json"
    $enode = $response.result.enode
    Write-Host "   Node 1 enode: $enode" -ForegroundColor Gray
    
    # Update node configs with bootnode
    (Get-Content config\node2.toml) -replace '# bootnodes=\[\]', "bootnodes=[`"$enode`"]" | Set-Content config\node2.toml
    (Get-Content config\node3.toml) -replace '# bootnodes=\[\]', "bootnodes=[`"$enode`"]" | Set-Content config\node3.toml
}
catch {
    Write-Host "   Warning: Could not get enode URL. Nodes may need manual bootnode configuration." -ForegroundColor Yellow
}

# Start Node 2
Write-Host "[+] Starting Node 2 (Port 8546)..." -ForegroundColor Cyan
Start-Process -FilePath "besu" -ArgumentList "--config-file=config\node2.toml" -RedirectStandardOutput "logs\node2.log" -RedirectStandardError "logs\node2-error.log" -WindowStyle Hidden
Start-Sleep -Seconds 2

# Start Node 3
Write-Host "[+] Starting Node 3 (Port 8547)..." -ForegroundColor Cyan
Start-Process -FilePath "besu" -ArgumentList "--config-file=config\node3.toml" -RedirectStandardOutput "logs\node3.log" -RedirectStandardError "logs\node3-error.log" -WindowStyle Hidden
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[!] Network Started Successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "Node 1 RPC: http://localhost:8545" -ForegroundColor White
Write-Host "Node 2 RPC: http://localhost:8546" -ForegroundColor White
Write-Host "Node 3 RPC: http://localhost:8547" -ForegroundColor White
Write-Host ""
Write-Host "[i] Gas Price: 0 (FREE TRANSACTIONS)" -ForegroundColor Yellow
Write-Host "[i] Chain ID: 1337" -ForegroundColor Cyan
Write-Host "[i] Consensus: IBFT 2.0" -ForegroundColor Magenta
Write-Host ""
Write-Host "View Logs:" -ForegroundColor Cyan
Write-Host "   Get-Content logs\node1.log -Wait" -ForegroundColor Gray
Write-Host "   Get-Content logs\node2.log -Wait" -ForegroundColor Gray
Write-Host "   Get-Content logs\node3.log -Wait" -ForegroundColor Gray
Write-Host ""
Write-Host "[!] To stop: .\stop-network.ps1" -ForegroundColor Yellow
