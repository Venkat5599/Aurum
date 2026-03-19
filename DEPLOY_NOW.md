# Deploy Aurum NOW - Copy & Paste Commands

**Time Required:** 15-20 minutes  
**Cost:** Free (Devnet SOL from faucet)

---

## ⚡ Option 1: Automated Deploy (Recommended)

### For Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### For Windows (PowerShell):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy.ps1
```

**That's it!** The script handles everything automatically.

---

## ⚡ Option 2: Manual Deploy (5 Commands)

Copy and paste these commands one by one:

### 1️⃣ Setup (30 seconds)
```bash
solana config set --url devnet && solana airdrop 2
```

### 2️⃣ Install (1 minute)
```bash
yarn install
```

### 3️⃣ Build (2-3 minutes)
```bash
anchor build
```

### 4️⃣ Deploy (5-10 minutes)
```bash
anchor deploy --provider.cluster devnet
```

### 5️⃣ Save Program IDs
**IMPORTANT:** Copy the program IDs from the output and save them!

Example output:
```
Program Id: AuVau1t7xK9mF3qZ8... (vault)
Program Id: AuComp1xK9mF3qZ8... (compliance)
Program Id: AuOrac1xK9mF3qZ8... (oracle)
Program Id: AuYie1dxK9mF3qZ8... (yield_optimizer)
```

### 6️⃣ Update .env
```bash
cp .env.example .env
nano .env
```

Paste your program IDs into `.env`:
```bash
NEXT_PUBLIC_VAULT_PROGRAM_ID=<paste_vault_id>
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=<paste_compliance_id>
NEXT_PUBLIC_ORACLE_PROGRAM_ID=<paste_oracle_id>
NEXT_PUBLIC_YIELD_PROGRAM_ID=<paste_yield_id>
```

---

## ⚡ Option 3: One-Liner (Advanced)

```bash
solana config set --url devnet && \
solana airdrop 2 && \
yarn install && \
anchor build && \
anchor deploy --provider.cluster devnet
```

Then manually update `.env` with program IDs.

---

## 🎯 After Deployment

### Initialize Programs
```bash
ts-node scripts/initialize.ts
```

### Deploy Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your program IDs
yarn install
vercel
```

---

## ✅ Verify Deployment

### Check Programs on Explorer
```bash
# Replace with your actual program ID
open "https://explorer.solana.com/address/YOUR_VAULT_PROGRAM_ID?cluster=devnet"
```

### Run Tests
```bash
anchor test --skip-local-validator
```

---

## 🐛 If Something Goes Wrong

### Not Enough SOL?
```bash
solana airdrop 2
# Or visit: https://faucet.solana.com
```

### Build Failed?
```bash
anchor clean && anchor build
```

### Deploy Failed?
```bash
# Check balance
solana balance

# Try again
anchor deploy --provider.cluster devnet
```

### Need Help?
- Check `DEPLOYMENT_GUIDE.md` for detailed instructions
- Check `COMMANDS.md` for all available commands
- Check `TROUBLESHOOTING.md` for common issues

---

## 📊 Expected Timeline

| Step | Time | What Happens |
|------|------|--------------|
| Setup | 30s | Configure Solana, get SOL |
| Install | 1m | Download dependencies |
| Build | 3m | Compile Rust programs |
| Deploy | 8m | Upload to Solana devnet |
| Initialize | 2m | Setup program accounts |
| Frontend | 5m | Deploy to Vercel |
| **Total** | **~20m** | **Complete deployment** |

---

## 🎬 Quick Start Video Script

If you're recording a deployment video:

```
[0:00] "Let me show you how to deploy Aurum in under 20 minutes"
[0:05] "First, configure Solana for devnet and get some SOL"
       $ solana config set --url devnet
       $ solana airdrop 2
[0:30] "Install dependencies"
       $ yarn install
[1:00] "Build the programs - this takes about 3 minutes"
       $ anchor build
[4:00] "Deploy to devnet - this takes 5-10 minutes"
       $ anchor deploy --provider.cluster devnet
[12:00] "Copy the program IDs and update .env"
[13:00] "Initialize the programs"
        $ ts-node scripts/initialize.ts
[15:00] "Deploy the frontend to Vercel"
        $ cd frontend && vercel
[18:00] "And we're live! Let's test it"
[19:00] "Connect wallet, mint auUSD, done!"
```

---

## 🚀 Production Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Frontend tested thoroughly
- [ ] Documentation complete
- [ ] Team ready for support
- [ ] Monitoring setup
- [ ] Backup plan ready

**⚠️ DO NOT deploy to mainnet without a security audit!**

---

## 📞 Support

Stuck? Here's where to get help:

1. **Check docs first:**
   - `DEPLOYMENT_GUIDE.md` - Detailed guide
   - `COMMANDS.md` - All commands
   - `TROUBLESHOOTING.md` - Common issues

2. **Still stuck?**
   - Open an issue on GitHub
   - Ask in Discord
   - Email: team@aurum.io

---

## 🎉 Success!

Once deployed, you should have:

✅ 4 programs on Solana devnet  
✅ Frontend on Vercel  
✅ Working demo  
✅ Program IDs saved  
✅ Ready for submission  

**Next:** Record your demo videos and submit to StableHacks 2026!

---

**Let's go! 🚀**
