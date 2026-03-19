#!/bin/bash

# Quick start script for Aurum
# This script sets up everything needed to run the project

set -e

echo "🚀 Aurum Quick Start"
echo "===================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+"
    exit 1
fi

if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI is not installed. Please install Solana CLI"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo "⚠️  Anchor CLI is not installed. Skipping program build."
    SKIP_BUILD=true
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
yarn install
cd frontend && yarn install && cd ..
echo "✅ Dependencies installed"
echo ""

# Build programs (if Anchor is available)
if [ "$SKIP_BUILD" != "true" ]; then
    echo "🔨 Building Solana programs..."
    anchor build
    echo "✅ Programs built"
    echo ""
fi

# Check if wallet exists
WALLET_PATH="$HOME/.config/solana/id.json"
if [ ! -f "$WALLET_PATH" ]; then
    echo "❌ Solana wallet not found at $WALLET_PATH"
    echo "   Create one with: solana-keygen new"
    exit 1
fi

# Check devnet balance
echo "💰 Checking devnet balance..."
BALANCE=$(solana balance --url devnet 2>/dev/null || echo "0")
echo "   Balance: $BALANCE"

if [[ "$BALANCE" == "0"* ]]; then
    echo "   Requesting airdrop..."
    solana airdrop 2 --url devnet || echo "⚠️  Airdrop failed, you may need to request manually"
fi
echo ""

# Initialize programs
echo "🎯 Initializing on-chain programs..."
if [ -f "scripts/initialize-programs.ts" ]; then
    yarn init || echo "⚠️  Initialization failed. You may need to run it manually: yarn init"
else
    echo "⚠️  Initialization script not found. Skipping..."
fi
echo ""

# Start frontend
echo "🌐 Starting frontend..."
echo "   The app will be available at http://localhost:3000"
echo ""
echo "✨ Setup complete! Starting development server..."
echo ""

cd frontend && yarn dev
