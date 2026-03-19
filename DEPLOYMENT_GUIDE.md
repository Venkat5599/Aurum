# Aurum Deployment Guide

Complete step-by-step guide to deploy Aurum programs to Solana Devnet.

## Prerequisites Check

Run these commands to verify your setup:

```bash
# Check Rust version (need 1.75+)
rustc --version

# Check Solana CLI (need 1.18+)
solana --version

# Check Anchor CLI (need 0.30+)
anchor --version

# Check Node.js (need 20+)
node --version
```

If any are missing, install them first.

---

## Step 1: Initial Setup (5 minutes)

### 1.1 Configure Solana CLI

```bash
# Set cluster to devnet
solana config set --url devnet

# Verify configuration
solana config get
```

Expected output:
```
Config File: ~/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: ~/.config/solana/id.json
Commitment: confirmed
```

### 1.2 Create or Use Existing Wallet

**Option A: Create new wallet**
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

**Option B: Use existing wallet**
```bash
# If you have an existing keypair, copy it to:
# ~/.config/solana/id.json
```

### 1.3 Check Your Wallet Address

```bash
solana address
```

Save this address - you'll need it!

### 1.4 Get Devnet SOL

```bash
# Request 2 SOL (you need ~1-2 SOL for deployment)
solana airdrop 2

# Check balance
solana balance
```

**If airdrop fails**, use a faucet:
- https://faucet.solana.com
- https://solfaucet.com

You need at least **1 SOL** to deploy all programs.

---

## Step 2: Install Dependencies (2 minutes)

```bash
# Install root dependencies
yarn install

# Or if you prefer npm
npm install
```

---

## Step 3: Build Programs (3-5 minutes)

```bash
# Clean previous builds (if any)
anchor clean

# Build all programs
anchor build
```

This will:
- Compile all 4 Rust programs
- Generate program binaries in `target/deploy/`
- Generate IDL files in `target/idl/`

**Expected output:**
```
Building vault...
Building compliance...
Building oracle...
Building yield_optimizer...
Build successful!
```

### Verify Build

```bash
# Check that .so files were created
ls -lh target/deploy/*.so

# Check that IDL files were created
ls -lh target/idl/*.json
```

You should see:
- `vault.so`
- `compliance.so`
- `oracle.so`
- `yield_optimizer.so`

---

## Step 4: Deploy Programs (5-10 minutes)

### 4.1 Deploy All Programs

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet
```

**This will:**
1. Upload each program to Solana devnet
2. Output program IDs for each deployed program
3. Take 2-5 minutes depending on network speed

### 4.2 Save Program IDs

**IMPORTANT:** Copy the program IDs from the output!

Example output:
```
Program Id: AuVau1t7xK9mF3qZ8... (vault)
Program Id: AuComp1xK9mF3qZ8... (compliance)
Program Id: AuOrac1xK9mF3qZ8... (oracle)
Program Id: AuYie1dxK9mF3qZ8... (yield_optimizer)
```

### 4.3 Update Anchor.toml

Edit `Anchor.toml` and replace the placeholder program IDs:

```toml
[programs.devnet]
vault = "YOUR_VAULT_PROGRAM_ID"
compliance = "YOUR_COMPLIANCE_PROGRAM_ID"
oracle = "YOUR_ORACLE_PROGRAM_ID"
yield_optimizer = "YOUR_YIELD_OPTIMIZER_PROGRAM_ID"
```

### 4.4 Update .env

Create `.env` from template and add your program IDs:

```bash
cp .env.example .env
```

Edit `.env`:
```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Replace with your actual program IDs
NEXT_PUBLIC_VAULT_PROGRAM_ID=YOUR_VAULT_PROGRAM_ID
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=YOUR_COMPLIANCE_PROGRAM_ID
NEXT_PUBLIC_ORACLE_PROGRAM_ID=YOUR_ORACLE_PROGRAM_ID
NEXT_PUBLIC_YIELD_PROGRAM_ID=YOUR_YIELD_OPTIMIZER_PROGRAM_ID
NEXT_PUBLIC_AUUSD_MINT=YOUR_AUUSD_MINT_ADDRESS
```

---

## Step 5: Verify Deployment

### 5.1 Check Programs on Explorer

Visit Solana Explorer for each program:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

You should see:
- Program deployed
- Executable: Yes
- Owner: BPFLoaderUpgradeable

### 5.2 Test with Anchor

```bash
# Run tests (optional but recommended)
anchor test --skip-local-validator
```

---

## Step 6: Initialize Programs (5 minutes)

Now that programs are deployed, you need to initialize them.

### 6.1 Create Initialization Script

Create `scripts/initialize.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";

async function main() {
  // Setup provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  console.log("🚀 Initializing Aurum programs...\n");
  console.log("Wallet:", provider.wallet.publicKey.toString());

  // Load programs
  const vaultProgram = anchor.workspace.Vault;
  const complianceProgram = anchor.workspace.Compliance;
  const oracleProgram = anchor.workspace.Oracle;

  // 1. Create auUSD mint
  console.log("1. Creating auUSD mint...");
  const auusdMint = await createMint(
    provider.connection,
    provider.wallet.payer,
    provider.wallet.publicKey, // mint authority (will be transferred to vault)
    null, // freeze authority
    6 // decimals
  );
  console.log("✅ auUSD Mint:", auusdMint.toString());

  // 2. Initialize Oracle
  console.log("\n2. Initializing Oracle...");
  const [oracleData] = PublicKey.findProgramAddressSync(
    [Buffer.from("oracle"), provider.wallet.publicKey.toBuffer()],
    oracleProgram.programId
  );

  try {
    await oracleProgram.methods
      .initialize()
      .accounts({
        oracleData,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    console.log("✅ Oracle initialized:", oracleData.toString());
  } catch (e) {
    console.log("⚠️  Oracle already initialized or error:", e.message);
  }

  // 3. Initialize Vault
  console.log("\n3. Initializing Vault...");
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
    vaultProgram.programId
  );

  try {
    await vaultProgram.methods
      .initialize(110) // 110% over-collateralization
      .accounts({
        vault,
        authority: provider.wallet.publicKey,
        auusdMint,
        oracle: oracleData,
        compliance: complianceProgram.programId,
      })
      .rpc();
    console.log("✅ Vault initialized:", vault.toString());
  } catch (e) {
    console.log("⚠️  Vault already initialized or error:", e.message);
  }

  // 4. Update Oracle with initial prices
  console.log("\n4. Setting initial oracle prices...");
  try {
    await oracleProgram.methods
      .updatePrices(
        new anchor.BN(265000000000), // $2,650.00 gold
        new anchor.BN(3120000000),   // $31.20 silver
        new anchor.BN(108000000)     // 1.08 EUR/USD
      )
      .accounts({
        oracleData,
        authority: provider.wallet.publicKey,
      })
      .rpc();
    console.log("✅ Oracle prices updated");
  } catch (e) {
    console.log("⚠️  Error updating prices:", e.message);
  }

  console.log("\n🎉 Initialization complete!");
  console.log("\n📝 Add these to your .env:");
  console.log(`NEXT_PUBLIC_AUUSD_MINT=${auusdMint.toString()}`);
  console.log(`NEXT_PUBLIC_ORACLE_DATA=${oracleData.toString()}`);
  console.log(`NEXT_PUBLIC_VAULT=${vault.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 6.2 Run Initialization

```bash
# Make sure you're in the project root
anchor run initialize
```

Or:

```bash
ts-node scripts/initialize.ts
```

### 6.3 Update .env with New Addresses

Add the output addresses to your `.env` file.

---

## Step 7: Deploy Frontend (10 minutes)

### 7.1 Setup Frontend Environment

```bash
cd frontend

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your program IDs
nano .env.local
```

### 7.2 Install Frontend Dependencies

```bash
yarn install
```

### 7.3 Test Locally

```bash
# Start development server
yarn dev
```

Visit `http://localhost:3000` and test:
- Wallet connection
- Dashboard loads
- No console errors

### 7.4 Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: aurum
# - Directory: ./
# - Override settings? No
```

### 7.5 Add Environment Variables in Vercel

Go to Vercel dashboard → Your Project → Settings → Environment Variables

Add all variables from `.env.local`:
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_CLUSTER`
- `NEXT_PUBLIC_VAULT_PROGRAM_ID`
- `NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID`
- `NEXT_PUBLIC_ORACLE_PROGRAM_ID`
- `NEXT_PUBLIC_YIELD_PROGRAM_ID`
- `NEXT_PUBLIC_AUUSD_MINT`

### 7.6 Redeploy with Environment Variables

```bash
vercel --prod
```

---

## Step 8: Verify Everything Works

### 8.1 Test Programs

```bash
# From project root
anchor test --skip-local-validator
```

### 8.2 Test Frontend

Visit your Vercel URL and test:
- [ ] Wallet connects
- [ ] Dashboard displays
- [ ] Oracle prices show
- [ ] No console errors

### 8.3 Check Solana Explorer

For each program, verify on explorer:
```
https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet
```

---

## Quick Reference Commands

### Build & Deploy
```bash
# Clean build
anchor clean && anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test --skip-local-validator
```

### Check Status
```bash
# Check balance
solana balance

# Check program
solana program show YOUR_PROGRAM_ID --url devnet

# Get more SOL
solana airdrop 2
```

### Frontend
```bash
# Local development
cd frontend && yarn dev

# Deploy to Vercel
vercel --prod
```

---

## Troubleshooting

### "Insufficient funds" Error
```bash
# Get more SOL
solana airdrop 2

# Or use faucet: https://faucet.solana.com
```

### "Program already deployed" Error
```bash
# Upgrade existing program
anchor upgrade target/deploy/vault.so --program-id YOUR_PROGRAM_ID --provider.cluster devnet
```

### Build Errors
```bash
# Clean everything
anchor clean
cargo clean
rm -rf target

# Rebuild
anchor build
```

### RPC Rate Limiting
Use a dedicated RPC provider:
- Helius: https://helius.dev
- QuickNode: https://quicknode.com

Update in `.env`:
```bash
NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

---

## Cost Estimate

Deploying to Devnet:
- **Vault program:** ~0.3 SOL
- **Compliance program:** ~0.3 SOL
- **Oracle program:** ~0.2 SOL
- **Yield Optimizer program:** ~0.2 SOL
- **Total:** ~1-1.5 SOL

Devnet SOL is free from faucets!

---

## Next Steps

After successful deployment:

1. ✅ Update `README.md` with your program IDs
2. ✅ Update `SUBMISSION.md` with demo URL
3. ✅ Test all features in the frontend
4. ✅ Record demo videos
5. ✅ Submit to DoraHacks

---

## Support

Need help?
- Check `docs/QUICKSTART.md`
- Review `HACKATHON_CHECKLIST.md`
- Open an issue on GitHub
- Ask in Discord

**Good luck! 🚀**
