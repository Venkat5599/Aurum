# Aurum Integration Guide

Complete guide for setting up and running the fully integrated Aurum platform.

## Prerequisites

- Rust 1.75+
- Solana CLI 3.1+
- Anchor CLI 0.32+
- Node.js 20+
- Yarn or npm

## Step 1: Build Programs

```bash
# Build all Solana programs
anchor build

# This generates:
# - target/deploy/*.so (program binaries)
# - target/idl/*.json (Interface Definition Language files)
```

## Step 2: Deploy to Devnet

```bash
# Ensure you have SOL in your devnet wallet
solana airdrop 2 --url devnet

# Deploy all programs
anchor deploy --provider.cluster devnet

# Program IDs are already in Anchor.toml:
# - Vault: CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn
# - Compliance: zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz
# - Oracle: FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp
# - Yield Optimizer: 4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS
```

## Step 3: Initialize On-Chain State

```bash
# Install dependencies
yarn install

# Run initialization script
npx ts-node scripts/initialize-programs.ts

# This will:
# 1. Create auUSD mint
# 2. Initialize oracle with prices
# 3. Initialize vault
# 4. Generate frontend/.env.local with all addresses
```

## Step 4: Setup Frontend

```bash
cd frontend

# Install dependencies
yarn install

# The .env.local file was created by the initialization script
# It contains all program IDs and mint addresses

# Start development server
yarn dev
```

## Step 5: Test the Integration

### 5.1 Connect Wallet
1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select Phantom/Solflare (ensure you're on Devnet)

### 5.2 Initialize User Compliance
```bash
# The first time a user interacts, they need to initialize their compliance state
# This happens automatically when you click "Verify KYC"
```

### 5.3 Verify KYC
1. Go to Dashboard → Compliance tab
2. Click "Verify KYC with Zero-Knowledge Proof"
3. Approve the transaction
4. Your KYC status should show "Verified"

### 5.4 Initialize Yield Strategy
1. Go to Dashboard → Yield tab
2. Select a risk profile (Conservative/Moderate/Aggressive)
3. Approve the transaction

### 5.5 Mint auUSD
1. Go to Dashboard → Mint tab
2. Select collateral type (Gold/Silver)
3. Enter amount
4. Click "Mint auUSD"
5. Approve the transaction

**Note:** For demo purposes, you'll need mock collateral tokens. In production, these would be actual tokenized gold/silver.

### 5.6 Redeem Collateral
1. Go to Dashboard → Redeem tab
2. Enter auUSD amount to burn
3. Select collateral type to receive
4. Click "Redeem Collateral"
5. Approve the transaction

## Real-Time Data Updates

The frontend automatically fetches real blockchain data every 5-10 seconds:

- **Compliance Data**: KYC status, risk score, transaction count
- **Vault Data**: Total minted, collateral value, user balance
- **Oracle Data**: Gold/silver prices, EUR/USD rate
- **Yield Data**: Strategy allocation, current APY

## Update Oracle Prices (Optional)

To simulate real-time price updates:

```bash
# Run this periodically (or set up a cron job)
npx ts-node scripts/update-oracle-prices.ts
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Compliance  │  │    Yield     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Anchor/Web3.js
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Solana Programs (Rust)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Vault     │◄─┤  Compliance  │  │    Oracle    │      │
│  │ (Mint/Redeem)│  │  (KYC/KYT)   │  │   (Prices)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                                      │             │
│         └──────────────┬───────────────────────┘             │
│                        ▼                                     │
│                ┌──────────────┐                              │
│                │    Yield     │                              │
│                │  Optimizer   │                              │
│                └──────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## Transaction Flow Examples

### Minting auUSD
1. Frontend calls `mintAuusd()` in `lib/transactions/vault.ts`
2. Derives vault PDA and user state PDA
3. Checks/creates user's auUSD token account
4. Builds Anchor instruction with proper accounts
5. Sends transaction to Solana
6. Vault program:
   - Verifies KYC via compliance program
   - Calculates collateral value from oracle
   - Checks over-collateralization
   - Transfers collateral to vault
   - Mints auUSD to user

### KYC Verification
1. Frontend calls `verifyKyc()` in `lib/transactions/compliance.ts`
2. Initializes user state if needed
3. Generates mock ZK proof (in production: real ZK circuit)
4. Sends transaction with proof data
5. Compliance program:
   - Validates proof
   - Sets KYC verified flag
   - Sets expiry timestamp
   - Emits KYC event

## Troubleshooting

### "Account not found" errors
- Run the initialization script: `npx ts-node scripts/initialize-programs.ts`
- Ensure your wallet has SOL on devnet

### "Insufficient funds" errors
- Get devnet SOL: `solana airdrop 2 --url devnet`

### Frontend not connecting to programs
- Check `frontend/.env.local` has correct program IDs
- Restart the dev server after updating .env

### Transactions failing
- Check Solana Explorer for detailed error messages
- Ensure all PDAs are derived correctly
- Verify account initialization order (compliance → vault → yield)

## Production Deployment

For mainnet deployment:

1. **Audit all programs** - Get professional security audit
2. **Update Anchor.toml** - Change cluster to mainnet-beta
3. **Deploy programs** - `anchor deploy --provider.cluster mainnet-beta`
4. **Use real oracles** - Integrate actual SIX data feeds
5. **Implement real ZK proofs** - Use production ZK circuits
6. **Set up monitoring** - Track program health and metrics
7. **Configure frontend** - Update RPC URLs and program IDs

## Support

- GitHub Issues: https://github.com/Venkat5599/Aurum/issues
- Documentation: See SUBMISSION.md for detailed architecture
- Solana Explorer: https://explorer.solana.com/?cluster=devnet
