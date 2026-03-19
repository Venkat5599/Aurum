# StableHacks 2026 Submission Checklist

## ✅ Pre-Submission (Complete Before March 22, 2026)

### Code & Deployment
- [ ] All Solana programs built successfully (`anchor build`)
- [ ] Programs deployed to Devnet
- [ ] Program IDs updated in .env and Anchor.toml
- [ ] Frontend deployed to Vercel
- [ ] Custom domain configured (optional but recommended)
- [ ] All environment variables set in Vercel
- [ ] Test deployment in incognito browser

### Testing
- [ ] All Anchor tests pass (`anchor test`)
- [ ] Manual testing completed:
  - [ ] Wallet connection works
  - [ ] KYC verification flow
  - [ ] Mint auUSD transaction
  - [ ] Transfer with Travel Rule
  - [ ] Redeem transaction
  - [ ] Oracle price updates
  - [ ] Yield dashboard displays correctly
- [ ] No console errors in browser
- [ ] Mobile responsive (bonus)

### Documentation
- [ ] README.md complete with setup instructions
- [ ] SUBMISSION.md finalized (all 8 sections)
- [ ] LICENSE file added
- [ ] .env.example provided
- [ ] Code comments added to complex functions
- [ ] Architecture diagrams created (optional)

### Videos
- [ ] 3-minute pitch video recorded
  - [ ] Problem statement (0-30s)
  - [ ] Solution overview (30-120s)
  - [ ] Demo highlights (120-180s)
  - [ ] Team & CTA (180-210s)
- [ ] 3-minute technical walkthrough recorded
  - [ ] Connect wallet (0-20s)
  - [ ] KYC verification (20-50s)
  - [ ] Mint auUSD (50-90s)
  - [ ] Compliant transfer (90-150s)
  - [ ] Yield & oracle (150-180s)
- [ ] Both videos uploaded to YouTube
- [ ] Captions added (auto-generate then edit)
- [ ] Video quality 1080p minimum
- [ ] Audio clear and professional

### GitHub Repository
- [ ] Repository public
- [ ] Clean commit history (no secrets)
- [ ] All code pushed
- [ ] README badges added
- [ ] Topics/tags added (solana, defi, rwa, stablecoin)
- [ ] No node_modules or build artifacts committed
- [ ] .gitignore properly configured

---

## 📝 DoraHacks Submission Form

### Basic Information
- [ ] Project name: "Aurum"
- [ ] Tagline: "Regulator-native programmable commodity vault on Solana"
- [ ] Track: "RWA-Backed Stablecoin & Commodity Vaults"
- [ ] Description: (Copy from SUBMISSION.md Section 1)

### Links
- [ ] GitHub: `https://github.com/[username]/aurum`
- [ ] Live Demo: `https://aurum-demo.vercel.app`
- [ ] Pitch Video: `https://youtube.com/watch?v=...`
- [ ] Technical Video: `https://youtube.com/watch?v=...`
- [ ] Twitter: `https://twitter.com/[handle]`
- [ ] Website: (optional)

### Team
- [ ] All team members added with:
  - [ ] Full name
  - [ ] Role
  - [ ] LinkedIn profile
  - [ ] GitHub profile
  - [ ] Brief bio (2-3 sentences)

### Tech Stack
- [ ] Tags selected:
  - [ ] Solana
  - [ ] Rust
  - [ ] Anchor
  - [ ] SPL Token
  - [ ] Zero-Knowledge Proofs
  - [ ] Next.js
  - [ ] TypeScript
  - [ ] DeFi
  - [ ] RWA
  - [ ] Stablecoins

### Additional Materials
- [ ] Architecture diagram uploaded (optional)
- [ ] Pitch deck uploaded (optional)
- [ ] Whitepaper/technical docs (optional)

---

## 🎯 Judging Criteria Alignment

### 1. Team Execution & Technical Readiness (25%)
**Evidence to highlight:**
- [ ] Full-stack implementation (4 Solana programs + Next.js frontend)
- [ ] Deployed on Devnet (provide explorer links)
- [ ] Working demo (provide test wallet addresses)
- [ ] Open-source code (GitHub link)
- [ ] Tests included (show test results)

**In submission, emphasize:**
> "Unlike typical hackathon prototypes, Aurum is a pilot-ready system with 4 deployed Solana programs, comprehensive testing, and a production-grade frontend. All code is open-source and auditable."

### 2. Institutional Fit & Compliance Awareness (25%)
**Evidence to highlight:**
- [ ] ZK-KYC implementation
- [ ] Travel Rule automation
- [ ] KYT real-time monitoring
- [ ] AML freeze mechanisms
- [ ] SIX data integration (partner validation)

**In submission, emphasize:**
> "Aurum speaks the language of regulators. Our protocol-native compliance (ZK-KYC, Travel Rule, KYT, AML) isn't bolted on—it's embedded in smart contract logic. Direct integration with SIX data and AMINA Bank validates our institutional approach."

### 3. Stablecoin Infrastructure Innovativeness (25%)
**Evidence to highlight:**
- [ ] Commodity-backed (unique vs USDC/USDT)
- [ ] Dynamic yield (unique vs Paxos Gold)
- [ ] Programmable compliance (unique vs existing RWAs)
- [ ] SPL Token-2022 extensions
- [ ] Over-collateralization mechanics

**In submission, emphasize:**
> "We're not competing with USDC or Paxos Gold—we're creating a new category: programmable commodity money. No existing project combines RWA backing + dynamic yield + embedded compliance + volatility-proof mechanics."

### 4. Scalability & Adoption Potential (15%)
**Evidence to highlight:**
- [ ] Solana's 65K TPS
- [ ] Modular architecture
- [ ] Multi-commodity support
- [ ] Pilot path (AMINA, Solstice, UBS)
- [ ] Market size ($12T commodities, $150B stablecoins)

**In submission, emphasize:**
> "We have LOIs from two partners (AMINA Bank, Solstice) and a clear path to $1.5-3B TVL in year one. Our modular architecture supports expansion to platinum, palladium, and copper without code changes."

### 5. Submission Clarity & Completeness (10%)
**Evidence to highlight:**
- [ ] Comprehensive SUBMISSION.md (8 sections)
- [ ] Professional videos (pitch + technical)
- [ ] Clean GitHub repo
- [ ] Live demo with test wallets
- [ ] Clear documentation

**In submission, emphasize:**
> "Every question a judge could ask is answered before they ask it. Our submission includes complete technical architecture, compliance deep-dive, demo scripts, and GitHub repo with deployment instructions."

---

## 🚀 Day-of-Submission Checklist (March 22, 2026)

### Morning (8 AM - 12 PM)
- [ ] Final test of live demo
- [ ] Verify all links work in incognito
- [ ] Check videos play correctly
- [ ] Review submission form one last time
- [ ] Take screenshots of working demo

### Afternoon (12 PM - 6 PM)
- [ ] Submit to DoraHacks
- [ ] Verify submission appears correctly
- [ ] Tweet announcement with #StableHacks2026
- [ ] Post in Discord/Telegram
- [ ] Email partners (SIX, AMINA) about submission

### Evening (6 PM - 11:59 PM)
- [ ] Monitor for any judge questions
- [ ] Respond to comments within 2 hours
- [ ] Keep demo running (no downtime)
- [ ] Backup all materials (videos, code, docs)

---

## 📧 Partner Outreach (Post-Submission)

### SIX Group
```
Subject: Aurum - StableHacks Submission Using SIX Data

Hi [Contact],

We've submitted Aurum to StableHacks 2026—a programmable commodity 
vault using SIX precious metals pricing as our oracle foundation.

Demo: [link]
GitHub: [link]

Would love to discuss production API integration. Available next week?

Best,
[Your Name]
```

### AMINA Bank
```
Subject: Aurum - Pilot-Ready Commodity Vault

Hi [Contact],

Following up on our previous conversations, we've built Aurum—
a compliant commodity vault with embedded KYC/AML/Travel Rule.

Live demo: [link]

Ready to discuss pilot deployment with Swiss SMEs. Can we schedule 
a call next week?

Best,
[Your Name]
```

---

## 🎉 Post-Submission Actions

### Week 1 (March 23-29)
- [ ] Monitor DoraHacks for judge questions
- [ ] Engage with other submissions (community points)
- [ ] Tweet progress updates
- [ ] Reach out to partners
- [ ] Prepare for potential live demo

### Week 2-4 (March 30 - April 19)
- [ ] If selected for finals, prepare live presentation
- [ ] Gather user feedback from demo
- [ ] Fix any bugs discovered
- [ ] Plan post-hackathon roadmap

### Judging Period
- [ ] Respond to all questions within 2 hours
- [ ] Keep demo running 24/7
- [ ] Monitor uptime (use UptimeRobot)
- [ ] Be available for live demo if requested

---

## 🏆 Winning Mindset

### What Judges Look For
1. **Can I run this?** → Clear setup docs, working demo
2. **Is this real?** → Deployed programs, live frontend
3. **Do they understand the market?** → Compliance depth, partner mentions
4. **Can this scale?** → Architecture, not just MVP hacks
5. **Will this exist post-hackathon?** → Team commitment, pilot path

### Red Flags to Avoid
- ❌ Broken demo links
- ❌ No commits in last week (looks abandoned)
- ❌ Overpromising without substance
- ❌ Ignoring compliance
- ❌ Copy-paste code from other projects

### Green Flags to Emphasize
- ✅ Working demo on mainnet/devnet
- ✅ Partner validation (SIX, AMINA)
- ✅ Clear revenue model
- ✅ Pilot-ready architecture
- ✅ Responsive to feedback

---

## 📞 Emergency Contacts

**If demo goes down:**
- Vercel support: support@vercel.com
- Helius RPC: support@helius.dev

**If videos won't upload:**
- YouTube support: youtube.com/t/contact_us
- Alternative: Vimeo, Loom

**If submission form issues:**
- DoraHacks support: support@dorahacks.io
- Discord: #support channel

---

## ✨ Final Checks (1 Hour Before Deadline)

- [ ] All links tested in incognito browser
- [ ] Videos play without errors
- [ ] Demo loads in <3 seconds
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All team members listed
- [ ] Submission form saved (not just draft)
- [ ] Confirmation email received
- [ ] Screenshot of submission taken
- [ ] Backup of all materials saved locally

---

**You've got this! 🚀**

Remember: Judges want to see projects that solve real problems, demonstrate technical excellence, and have a clear path to adoption. AurumForge checks all these boxes.

**Good luck!**
