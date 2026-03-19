# Aurum Quick Start Guide

This guide will get you up and running with Aurum in under 10 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ Rust 1.75+ installed
- ✅ Solana CLI 1.18+ installed
- ✅ Anchor CLI 0.30+ installed
- ✅ Node.js 20+ installed
- ✅ A Solana wallet with devnet SOL

## Step 1: Clone & Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/[your-username]/aurum.git
cd aurum

# Install dependencies
yarn install
cd frontend && yarn install && cd ..
```

## Step 2: Configure Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Get devnet SOL
solana config set --url devnet
solana airdrop 2
```

## Step 3: Build & Deploy Programs (3 minutes)

```bash
# Build all programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the program IDs and update .env
```

## Step 4: Initialize Vault (1 minute)

```bash
# Run initialization script
ts-node scripts/initialize-vault.ts
```

## Step 5: Start Frontend (1 minute)

```bash
cd frontend
yarn dev
```

Visit `http://localhost:3000` 🎉

## Step 6: Test the Flow (2 minutes)

1. **Connect Wallet**
   - Click "Connect Wallet" in top right
   - Select Phantom/Solflare (ensure on Devnet)

2. **Complete KYC**
   - Navigate to "Compliance" tab
   - Click "Verify KYC" (simulated for demo)
   - Sign message to generate ZK proof

3. **Mint auUSD**
   - Go to "Mint" tab
   - Enter amount of gold tokens to deposit
   - Click "Mint auUSD"
   - Approve transaction

4. **View Dashboard**
   - See your auUSD balance
   - Check collateral ratio
   - View yield allocation
   - Monitor oracle prices

5. **Transfer (with Travel Rule)**
   - Go to "Transfer" tab
   - Enter recipient address + amount >$3K
   - See Travel Rule payload attached automatically

6. **Redeem**
   - Go to "Redeem" tab
   - Enter auUSD amount to burn
   - Receive tokenized gold back instantly

## Troubleshooting

### "Insufficient SOL" error
```bash
solana airdrop 2
```

### "Program not found" error
- Ensure you deployed to devnet: `anchor deploy --provider.cluster devnet`
- Update .env with correct program IDs

### Frontend won't start
```bash
cd frontend
rm -rf node_modules .next
yarn install
yarn dev
```

### Wallet not connecting
- Ensure wallet is set to Devnet
- Try refreshing page
- Check browser console for errors

## Next Steps

- Read [SUBMISSION.md](../SUBMISSION.md) for full technical details
- Explore [Architecture](./ARCHITECTURE.md) for system design
- Check [Compliance](./COMPLIANCE.md) for KYC/KYT/AML details
- Review [API Reference](./API.md) for program instructions

## Need Help?

- 📧 Email: team@aurum.io
- 💬 Discord: [Join our server](https://discord.gg/...)
- 🐦 Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

**Happy Building! 🚀**
