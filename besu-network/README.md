# 🏛️ Bharat Registry - Besu Permissioned Network

## Overview

This directory contains configuration for a **zero-gas, permissioned blockchain network** using Hyperledger Besu with IBFT 2.0 consensus. All transactions are **completely free** for users while maintaining decentralization through multiple validator nodes.

## ✨ Key Features

- ✅ **Zero Gas Fees** - `min-gas-price=0` means FREE transactions for all users
- ✅ **Permissioned** - Consortium of known validators (3 nodes)
- ✅ **Decentralized** - Multiple independent validators reach consensus via IBFT 2.0
- ✅ **EVM Compatible** - Deploy existing Solidity contracts without modification
- ✅ **Fast** - 2-second block times

## 📋 Prerequisites

### Install Hyperledger Besu

**Windows:**

1. Download from: https://github.com/hyperledger/besu/releases
2. Extract to `C:\Program Files\Besu`
3. Add to PATH: `C:\Program Files\Besu\bin`
4. Verify: `besu --version`

**Linux/Mac:**

```bash
# Using Homebrew (Mac)
brew tap hyperledger/besu
brew install besu

# Or download binary
wget https://github.com/hyperledger/besu/releases/download/23.10.3/besu-23.10.3.tar.gz
tar -xzf besu-23.10.3.tar.gz
sudo mv besu-23.10.3 /opt/besu
export PATH=$PATH:/opt/besu/bin
```

## 🚀 Quick Start

### Windows

```powershell
cd besu-network
.\start-network.ps1
```

### Linux/Mac

```bash
cd besu-network
chmod +x start-network.sh stop-network.sh
./start-network.sh
```

## 🔧 Network Configuration

### Network Details

- **Chain ID:** 1337
- **Consensus:** IBFT 2.0 (Byzantine Fault Tolerant)
- **Block Time:** 2 seconds
- **Gas Price:** 0 (FREE)
- **Gas Limit:** Very high (no practical limit)

### Validator Nodes

| Node   | RPC Port | P2P Port | Coinbase Address                           |
| ------ | -------- | -------- | ------------------------------------------ |
| Node 1 | 8545     | 30303    | 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 |
| Node 2 | 8546     | 30304    | 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 |
| Node 3 | 8547     | 30305    | 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc |

### Pre-funded Accounts (Genesis)

All accounts start with massive balances (no need to worry about funds):

- `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
- `0x70997970c51812dc3a010c7d01b50e0d17dc79c8`
- `0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc`
- `0x90f79bf6eb2c4f870365e785982e1f101e93b906`

## 📊 Verify Network is Running

```bash
# Check if nodes are responsive
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545

# Check gas price (should be 0)
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_gasPrice","params":[],"id":1}' http://localhost:8545

# Check peer count
curl -X POST --data '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' http://localhost:8545
```

Expected results:

- Block number increasing
- Gas price: `0x0` (zero)
- Peer count: `0x2` (2 peers connected to node 1)

## 🏗️ Deploy Contracts to Besu Network

### Update Hardhat Config

Add Besu network to `blockchain/hardhat.config.js`:

```javascript
networks: {
  besu: {
    url: "http://127.0.0.1:8545",
    chainId: 1337,
    accounts: [
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      // Add more private keys as needed
    ],
    gasPrice: 0, // FREE TRANSACTIONS
  }
}
```

### Deploy Contracts

```bash
cd ../blockchain
npx hardhat run scripts/deploy.js --network besu
```

### Update Frontend/Backend

Point your application to Besu RPC:

**Frontend** (`frontend/.env`):

```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CHAIN_ID=1337
```

**Backend** (`backend/.env`):

```env
RPC_URL=http://127.0.0.1:8545
```

## 📝 Monitoring & Logs

View real-time logs:

**Windows:**

```powershell
Get-Content logs\node1.log -Wait
```

**Linux/Mac:**

```bash
tail -f logs/node1.log
```

## 🛑 Stop Network

**Windows:**

```powershell
.\stop-network.ps1
```

**Linux/Mac:**

```bash
./stop-network.sh
```

## 🔐 Production Considerations

### For Real Deployment:

1. **Use separate machines** for each validator (not localhost)
2. **Configure TLS** for RPC endpoints
3. **Set up permissioning** via contracts or config files
4. **Enable monitoring** (Prometheus, Grafana)
5. **Backup private keys** securely (HSM recommended)
6. **Configure firewall** rules to allow only validator peers
7. **Implement rate limiting** at application layer
8. **Add governance** for validator admission/removal

### Security Hardening:

```toml
# Remove ADMIN API in production
rpc-http-api=["ETH","NET","WEB3","TXPOOL"]

# Restrict CORS
rpc-http-cors-origins=["https://your-frontend-domain.com"]

# Enable permissioning (example)
permissions-nodes-config-file-enabled=true
permissions-nodes-config-file="config/permissions_config.toml"
```

## 🎯 Testing Free Transactions

```javascript
// Send a transaction with gasPrice = 0
const tx = await landRegistry.registerProperty(
  "SV-2024-001",
  "Mumbai, Maharashtra",
  1000,
  ethers.parseEther("5"),
  "QmXxx..."
);

// Gas cost = 0
console.log("Transaction cost:", tx.gasPrice * tx.gasUsed); // 0
```

## ❓ Troubleshooting

### Nodes not connecting

- Check logs: `logs/node1.log`
- Ensure no port conflicts (8545, 8546, 8547)
- Verify bootnodes are set correctly in `node2.toml` and `node3.toml`

### Transactions failing

- Verify gas price is 0: `eth_gasPrice` should return `0x0`
- Check account has balance (should from genesis)
- Ensure node is synced: `eth_syncing` should return `false`

### RPC not responding

- Check if Besu process is running
- Verify firewall allows localhost connections
- Try different RPC port

## 📚 Additional Resources

- [Hyperledger Besu Documentation](https://besu.hyperledger.org/)
- [IBFT 2.0 Consensus](https://besu.hyperledger.org/en/stable/HowTo/Configure/Consensus-Protocols/IBFT/)
- [Besu Permissioning](https://besu.hyperledger.org/en/stable/Concepts/Permissioning/)

---

**Network Status:** Ready for deployment 🚀
**Gas Cost:** FREE ⚡
**Decentralization:** Multi-validator IBFT 2.0 🏛️
