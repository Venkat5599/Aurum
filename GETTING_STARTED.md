# Getting Started with Aurum

Welcome! This guide will help you get Aurum up and running for your StableHacks 2026 submission.

## 📋 Pre-Flight Checklist

Before you start, make sure you have:

- [ ] Rust 1.75+ installed (`rustc --version`)
- [ ] Solana CLI 1.18+ installed (`solana --version`)
- [ ] Anchor CLI 0.30+ installed (`anchor --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Git installed
- [ ] A code editor (VS Code recommended)
- [ ] Phantom wallet installed (for testing)

## 🚀 Quick Start (15 minutes)

### Step 1: Clone & Setup (2 min)

```bash
# Clone the repository
git clone https://github.com/[your-username]/aurum.git
cd aurum

# Install dependencies
yarn install
```

### Step 2: Configure Solana (2 min)

```bash
# Set to devnet
solana config set --url devnet

# Create a new keypair (or use existing)
solana-keygen new

# Get some devnet SOL
solana airdrop 2
```

### Step 3: Build Programs (3 min)

```bash
# Build all Solana programs
anchor build

# This will create:
# - target/deploy/*.so (program binaries)
# - target/idl/*.json (program interfaces)
```

### Step 4: Deploy to Devnet (3 min)

```bash
# Deploy all programs
anchor deploy --provider.cluster devnet

# Note the program IDs that are output
# You'll need these for the next step
```

### Step 5: Update Environment (2 min)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your program IDs
# NEXT_PUBLIC_VAULT_PROGRAM_ID=<your_vault_id>
# NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=<your_compliance_id>
# etc.
```

### Step 6: Start Frontend (3 min)

```bash
# Install frontend dependencies
cd frontend
yarn install

# Copy frontend environment
cp .env.local.example .env.local

# Update with your program IDs (same as root .env)

# Start development server
yarn dev
```

Visit `http://localhost:3000` 🎉

## 🧪 Testing the Demo

### 1. Connect Wallet
- Open Phantom wallet
- Switch to Devnet
- Click "Connect Wallet" in the app
- Approve connection

### 2. Initialize User State
```bash
# Run initialization script
ts-node scripts/initialize-user.ts
```

### 3. Test Mint Flow
- Navigate to "Mint" tab
- Enter amount (e.g., 1 gold token)
- Click "Mint auUSD"
- Approve transaction in wallet
- See auUSD balance update

### 4. Test Compliance
- Go to "Compliance" tab
- Click "Verify KYC"
- Sign message
- See green verification badge

### 5. Test Transfer
- Go to "Transfer" tab
- Enter recipient address
- Enter amount >$3,000
- See Travel Rule payload attached
- Approve transaction

## 📦 What's Included

### Solana Programs (Rust)
- **Vault** - Core mint/redeem logic
- **Compliance** - KYC/KYT/AML/Travel Rule
- **Oracle** - SIX price feeds
- **Yield Optimizer** - Dynamic allocation

### Frontend (Next.js)
- Dashboard with real-time data
- Mint/redeem interface
- Compliance portal
- Yield analytics
- Oracle price display

### Documentation
- **SUBMISSION.md** - Complete hackathon submission
- **README.md** - Project overview
- **QUICKSTART.md** - 10-minute guide
- **HACKATHON_CHECKLIST.md** - Pre-submission checklist

## 🎬 Recording Your Videos

### Pitch Video (3 minutes)
Use the script in `SUBMISSION.md` Section 2:
- 0:00-0:30: Problem
- 0:30-2:00: Solution
- 2:00-2:30: Demo highlights
- 2:30-3:00: Team & CTA

**Tools:**
- Loom (easiest)
- OBS Studio (professional)
- ScreenFlow (Mac)

### Technical Walkthrough (3 minutes)
Use the script in `SUBMISSION.md` Section 5:
- Show connect wallet
- Demo KYC verification
- Mint auUSD
- Compliant transfer
- Yield dashboard
- Redeem

## 🚢 Deploying to Production

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Follow prompts
# Add environment variables in Vercel dashboard
```

### Programs (Mainnet)

```bash
# ⚠️ ONLY AFTER AUDIT ⚠️
anchor deploy --provider.cluster mainnet-beta
```

## 📝 Customization Checklist

Before submitting, update these placeholders:

### In All Files
- [ ] `[your-username]` → Your GitHub username
- [ ] `[Your Name]` → Your actual name
- [ ] `@yourhandle` → Your Twitter handle
- [ ] `team@aurum.io` → Your email

### In SUBMISSION.md
- [ ] Team member names and bios
- [ ] Video links (after recording)
- [ ] Demo URL (after deployment)
- [ ] Program IDs (after deployment)

### In README.md
- [ ] Demo link
- [ ] Video links
- [ ] Explorer links
- [ ] Team information

### In Frontend
- [ ] Logo (replace placeholder)
- [ ] Favicon
- [ ] Meta tags
- [ ] Social preview image

## 🐛 Troubleshooting

### "Insufficient SOL" Error
```bash
solana airdrop 2
# If that fails, use a faucet:
# https://solfaucet.com
```

### "Program not found" Error
- Ensure you deployed to devnet
- Check program IDs in .env match deployed IDs
- Verify RPC URL is correct

### Wallet Won't Connect
- Ensure wallet is on Devnet
- Clear browser cache
- Try different wallet (Solflare, Backpack)

### Build Errors
```bash
# Clean and rebuild
anchor clean
cargo clean
anchor build
```

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules .next
yarn install
yarn dev
```

## 📚 Additional Resources

### Solana Development
- [Solana Cookbook](https://solanacookbook.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Solana Stack Exchange](https://solana.stackexchange.com)

### StableHacks 2026
- [Official Website](https://stablehacks.io)
- [Discord](https://discord.gg/stablehacks)
- [Submission Guidelines](https://dorahacks.io/hackathon/stablehacks2026)

### Partners
- [SIX Group](https://www.six-group.com)
- [AMINA Bank](https://www.aminabank.com)
- [Solstice](https://www.solstice.finance)

## 🆘 Need Help?

### During Development
- Check `docs/QUICKSTART.md` for detailed steps
- Review `SUBMISSION.md` for architecture details
- Search issues on GitHub

### Before Submission
- Use `HACKATHON_CHECKLIST.md` to verify everything
- Test demo in incognito browser
- Verify all links work

### Emergency Contacts
- Email: team@aurum.io
- Discord: [Your server]
- Twitter: @yourhandle

## 🎯 Success Criteria

Your submission is ready when:

- ✅ All programs deployed to Devnet
- ✅ Frontend deployed to Vercel
- ✅ Demo works in incognito browser
- ✅ Both videos recorded and uploaded
- ✅ GitHub repo public with clean README
- ✅ All links tested
- ✅ DoraHacks form submitted

## 🏆 Final Tips

1. **Start Early** - Don't wait until the last day
2. **Test Everything** - Use incognito browser to verify
3. **Keep It Simple** - Focus on core features working well
4. **Document Well** - Judges appreciate clear docs
5. **Show, Don't Tell** - Working demo > fancy slides
6. **Be Responsive** - Answer judge questions quickly
7. **Have Fun** - You're building the future of finance!

---

**Good luck with your submission! 🚀**

*Questions? Open an issue or reach out on Discord.*
