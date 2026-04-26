#!/bin/bash

echo "🛑 Stopping Bharat Registry Besu Network..."

# Kill all Besu processes
pkill -f besu

echo "✅ Network stopped."
