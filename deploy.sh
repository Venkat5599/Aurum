#!/bin/bash

# Aurum Deployment Script
# This script automates the deployment of Aurum programs to Solana Devnet

set -e  # Exit on error

echo "🚀 Aurum Deployment Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Check Solana configuration
echo "🔧 Checking Solana configuration..."
CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
echo "Current cluster: $CLUSTER"

if [[ $CLUSTER != *"devnet"* ]]; then
    echo -e "${YELLOW}⚠️  Not on devnet. Switching to devnet...${NC}"
    solana config set --url devnet
fi

# Check balance
echo ""
echo "💰 Checking wallet balance..."
WALLET=$(solana address)
echo "Wallet address: $WALLET"

BALANCE=$(solana balance | awk '{print $1}')
echo "Balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Low balance. You need at least 1 SOL for deployment.${NC}"
    echo "Requesting airdrop..."
    solana airdrop 2 || echo -e "${YELLOW}Airdrop failed. Please use a faucet: https://faucet.solana.com${NC}"
    sleep 2
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if [ -f "yarn.lock" ]; then
    yarn install
elif [ -f "package-lock.json" ]; then
    npm install
else
    npm install
fi

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
anchor clean

# Build programs
echo ""
echo "🔨 Building programs..."
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed. Please check the errors above.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Deploy programs
echo ""
echo "🚀 Deploying programs to devnet..."
echo "This may take 5-10 minutes..."
echo ""

anchor deploy --provider.cluster devnet > deploy_output.txt 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed. Check deploy_output.txt for details.${NC}"
    cat deploy_output.txt
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful${NC}"
echo ""

# Extract program IDs
echo "📝 Extracting program IDs..."
echo ""

VAULT_ID=$(grep -A 1 "Program Id: " deploy_output.txt | grep -v "Program Id:" | head -1 | xargs)
COMPLIANCE_ID=$(grep -A 1 "Program Id: " deploy_output.txt | grep -v "Program Id:" | sed -n '2p' | xargs)
ORACLE_ID=$(grep -A 1 "Program Id: " deploy_output.txt | grep -v "Program Id:" | sed -n '3p' | xargs)
YIELD_ID=$(grep -A 1 "Program Id: " deploy_output.txt | grep -v "Program Id:" | sed -n '4p' | xargs)

echo "Vault Program ID:           $VAULT_ID"
echo "Compliance Program ID:      $COMPLIANCE_ID"
echo "Oracle Program ID:          $ORACLE_ID"
echo "Yield Optimizer Program ID: $YIELD_ID"
echo ""

# Create .env file
echo "📄 Creating .env file..."

cat > .env << EOF
# Solana Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Program IDs (Deployed on $(date))
NEXT_PUBLIC_VAULT_PROGRAM_ID=$VAULT_ID
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=$COMPLIANCE_ID
NEXT_PUBLIC_ORACLE_PROGRAM_ID=$ORACLE_ID
NEXT_PUBLIC_YIELD_PROGRAM_ID=$YIELD_ID

# These will be set after initialization
NEXT_PUBLIC_AUUSD_MINT=
NEXT_PUBLIC_ORACLE_DATA=
NEXT_PUBLIC_VAULT=
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo ""

# Update Anchor.toml
echo "📄 Updating Anchor.toml..."

# Backup original
cp Anchor.toml Anchor.toml.backup

# Update program IDs in Anchor.toml
sed -i.bak "s/vault = .*/vault = \"$VAULT_ID\"/" Anchor.toml
sed -i.bak "s/compliance = .*/compliance = \"$COMPLIANCE_ID\"/" Anchor.toml
sed -i.bak "s/oracle = .*/oracle = \"$ORACLE_ID\"/" Anchor.toml
sed -i.bak "s/yield_optimizer = .*/yield_optimizer = \"$YIELD_ID\"/" Anchor.toml

echo -e "${GREEN}✅ Anchor.toml updated${NC}"
echo ""

# Summary
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "Program IDs have been saved to:"
echo "  - .env (for frontend)"
echo "  - Anchor.toml (for testing)"
echo ""
echo "Next steps:"
echo "  1. Run initialization: ts-node scripts/initialize.ts"
echo "  2. Update frontend/.env.local with program IDs"
echo "  3. Deploy frontend: cd frontend && vercel"
echo "  4. Test the application"
echo ""
echo "View your programs on Solana Explorer:"
echo "  https://explorer.solana.com/address/$VAULT_ID?cluster=devnet"
echo ""
echo "Deployment log saved to: deploy_output.txt"
echo ""

# Cleanup
rm -f Anchor.toml.bak

echo -e "${GREEN}✅ All done! Happy hacking! 🚀${NC}"
