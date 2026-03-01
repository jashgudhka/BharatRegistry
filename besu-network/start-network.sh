#!/bin/bash

# Bharat Registry - Besu Permissioned Network Startup Script
# This script starts a 3-node IBFT 2.0 validator network with ZERO GAS FEES

echo "🚀 Starting Bharat Registry Besu Network (Zero Gas)"
echo "===================================================="

# Check if Besu is installed
if ! command -v besu &> /dev/null; then
    echo "❌ Besu is not installed. Please install from: https://besu.hyperledger.org/en/stable/HowTo/Get-Started/Install-Binaries/"
    exit 1
fi

# Create data directories
mkdir -p data/node1 data/node2 data/node3

# Start Node 1 (Primary Validator)
echo "📦 Starting Node 1 (Port 8545)..."
besu --config-file=config/node1.toml > logs/node1.log 2>&1 &
NODE1_PID=$!
echo "   Node 1 PID: $NODE1_PID"
sleep 3

# Get Node 1 enode URL
ENODE=$(curl -s -X POST --data '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}' http://localhost:8545 | jq -r '.result.enode')
echo "   Node 1 enode: $ENODE"

# Update node2 and node3 configs with bootnode
sed -i "s|# bootnodes=\[\]|bootnodes=[\"$ENODE\"]|g" config/node2.toml
sed -i "s|# bootnodes=\[\"enode://...\@127.0.0.1:30303\"\]|bootnodes=[\"$ENODE\"]|g" config/node2.toml
sed -i "s|# bootnodes=\[\"enode://...\@127.0.0.1:30303\"\]|bootnodes=[\"$ENODE\"]|g" config/node3.toml

# Start Node 2
echo "📦 Starting Node 2 (Port 8546)..."
besu --config-file=config/node2.toml > logs/node2.log 2>&1 &
NODE2_PID=$!
echo "   Node 2 PID: $NODE2_PID"
sleep 2

# Start Node 3
echo "📦 Starting Node 3 (Port 8547)..."
besu --config-file=config/node3.toml > logs/node3.log 2>&1 &
NODE3_PID=$!
echo "   Node 3 PID: $NODE3_PID"
sleep 2

echo ""
echo "✅ Network Started Successfully!"
echo "================================"
echo "Node 1 RPC: http://localhost:8545"
echo "Node 2 RPC: http://localhost:8546"
echo "Node 3 RPC: http://localhost:8547"
echo ""
echo "⚡ Gas Price: 0 (FREE TRANSACTIONS)"
echo "🔗 Chain ID: 1337"
echo "🏛️ Consensus: IBFT 2.0"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/node1.log"
echo "   tail -f logs/node2.log"
echo "   tail -f logs/node3.log"
echo ""
echo "🛑 To stop: ./stop-network.sh"
