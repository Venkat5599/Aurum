# Aurum - Quick Command Reference

All the commands you need to deploy and manage Aurum.

---

## 🚀 Quick Deploy (Automated)

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows (PowerShell):
```powershell
.\deploy.ps1
```

This automated script will:
- ✅ Check prerequisites
- ✅ Configure Solana for devnet
- ✅ Check/request SOL balance
- ✅ Install dependencies
- ✅ Build all programs
- ✅ Deploy to devnet
- ✅ Extract and save program IDs
- ✅ Update .env and Anchor.toml

---

## 📋 Manual Deployment (Step-by-Step)

### 1. Setup Solana

```bash
# Set to devnet
solana config set --url devnet

# Check configuration
solana config get

# Check your wallet address
solana address

# Get devnet SOL (need ~1-2 SOL)
solana airdrop 2

# Check balance
solana balance
```

### 2. Install Dependencies

```bash
# Install root dependencies
yarn install

# Or with npm
npm install
```

### 3. Build Programs

```bash
# Clean previous builds
anchor clean

# Build all programs
anchor build

# Verify build
ls -lh target/deploy/*.so
```

### 4. Deploy Programs

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Save the program IDs that are output!
```

### 5. Update Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your program IDs
nano .env
```

### 6. Initialize Programs

```bash
# Run initialization script
ts-node scripts/initialize.ts

# Or with anchor
anchor run initialize
```

---

## 🧪 Testing

### Run All Tests
```bash
anchor test --skip-local-validator
```

### Run Specific Test
```bash
anchor test --skip-local-validator -- --test vault
```

### Test with Local Validator
```bash
# Start local validator
solana-test-validator

# In another terminal
anchor test
```

---

## 🔍 Verification Commands

### Check Program on Explorer
```bash
# Replace YOUR_PROGRAM_ID with actual ID
open "https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet"
```

### Check Program Info
```bash
solana program show YOUR_PROGRAM_ID --url devnet
```

### Check Account Info
```bash
solana account YOUR_ACCOUNT_ADDRESS --url devnet
```

### Get Program Logs
```bash
solana logs YOUR_PROGRAM_ID --url devnet
```

---

## 💻 Frontend Commands

### Setup Frontend

```bash
cd frontend

# Install dependencies
yarn install

# Copy environment
cp .env.local.example .env.local

# Edit with your program IDs
nano .env.local
```

### Run Locally

```bash
# Development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

### Deploy to Vercel

```bash
# Install Vercel CLI (first time only)
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🔧 Maintenance Commands

### Upgrade Program

```bash
# Build new version
anchor build

# Upgrade specific program
anchor upgrade target/deploy/vault.so \
  --program-id YOUR_VAULT_PROGRAM_ID \
  --provider.cluster devnet
```

### Close Program (Recover SOL)

```bash
solana program close YOUR_PROGRAM_ID \
  --url devnet \
  --bypass-warning
```

### Transfer Program Authority

```bash
solana program set-upgrade-authority YOUR_PROGRAM_ID \
  --new-upgrade-authority NEW_AUTHORITY_ADDRESS \
  --url devnet
```

---

## 💰 Wallet Management

### Create New Wallet
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### Check Balance
```bash
solana balance
```

### Get Devnet SOL
```bash
# Via CLI
solana airdrop 2

# Via faucet (if CLI fails)
# Visit: https://faucet.solana.com
```

### Transfer SOL
```bash
solana transfer RECIPIENT_ADDRESS AMOUNT --url devnet
```

---

## 🐛 Troubleshooting Commands

### Check Solana Status
```bash
solana cluster-version
solana ping
```

### Check Transaction
```bash
solana confirm TRANSACTION_SIGNATURE --url devnet
```

### View Recent Transactions
```bash
solana transaction-history YOUR_ADDRESS --url devnet
```

### Clear Cache
```bash
# Anchor cache
anchor clean

# Cargo cache
cargo clean

# Node modules
rm -rf node_modules
yarn install
```

### Reset Solana Config
```bash
rm -rf ~/.config/solana
solana config set --url devnet
```

---

## 📊 Monitoring Commands

### Watch Program Logs
```bash
solana logs YOUR_PROGRAM_ID --url devnet
```

### Monitor Transactions
```bash
solana transaction-history YOUR_ADDRESS --url devnet --limit 10
```

### Check Network Performance
```bash
solana ping --url devnet
```

---

## 🔑 Environment Variables

### Required in .env
```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_VAULT_PROGRAM_ID=<your_id>
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=<your_id>
NEXT_PUBLIC_ORACLE_PROGRAM_ID=<your_id>
NEXT_PUBLIC_YIELD_PROGRAM_ID=<your_id>
NEXT_PUBLIC_AUUSD_MINT=<your_mint>
```

### Optional (Better RPC)
```bash
# Helius
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# QuickNode
NEXT_PUBLIC_RPC_URL=https://YOUR_ENDPOINT.devnet.quiknode.pro/YOUR_KEY/
```

---

## 📦 Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Solana shortcuts
alias sol='solana'
alias soldev='solana config set --url devnet'
alias solmain='solana config set --url mainnet-beta'
alias solbal='solana balance'
alias solair='solana airdrop 2'

# Anchor shortcuts
alias ab='anchor build'
alias at='anchor test --skip-local-validator'
alias ad='anchor deploy --provider.cluster devnet'
alias ac='anchor clean'

# Aurum shortcuts
alias aurum-deploy='./deploy.sh'
alias aurum-test='anchor test --skip-local-validator'
alias aurum-dev='cd frontend && yarn dev'
```

---

## 🆘 Emergency Commands

### Program Not Responding
```bash
# Check if program is deployed
solana program show YOUR_PROGRAM_ID --url devnet

# Redeploy
anchor deploy --provider.cluster devnet
```

### Out of SOL
```bash
# Request from faucet
solana airdrop 2

# Or visit: https://faucet.solana.com
# Or visit: https://solfaucet.com
```

### Build Errors
```bash
# Full clean rebuild
anchor clean
cargo clean
rm -rf target
anchor build
```

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules .next
yarn install
yarn dev
```

---

## 📚 Documentation Links

- [Solana Docs](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Cookbook](https://solanacookbook.com)
- [Solana Stack Exchange](https://solana.stackexchange.com)

---

## 🎯 Pre-Submission Checklist

```bash
# 1. Programs deployed
anchor deploy --provider.cluster devnet

# 2. Tests passing
anchor test --skip-local-validator

# 3. Frontend deployed
cd frontend && vercel --prod

# 4. Verify on explorer
open "https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet"

# 5. Test demo
open "https://your-demo.vercel.app"
```

---

**Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions!**
