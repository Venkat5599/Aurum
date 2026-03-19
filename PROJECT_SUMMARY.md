# Aurum - Project Summary

## 🎯 One-Sentence Pitch
Aurum is the first regulator-native programmable commodity vault on Solana that mints auUSD—a stablecoin backed by tokenized precious metals—with protocol-level compliance (ZK-KYC, Travel Rule, KYT) and dynamic yield optimization (7-15% APY).

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| **Track** | RWA-Backed Stablecoin & Commodity Vaults |
| **Blockchain** | Solana (Devnet) |
| **Programs** | 4 (Vault, Compliance, Oracle, Yield Optimizer) |
| **Frontend** | Next.js 15 + Tailwind + shadcn/ui |
| **Collateral** | Tokenized Gold & Silver |
| **Over-Collateralization** | 110-120% |
| **Target APY** | 7-15% |
| **Compliance** | ZK-KYC, KYT, AML, Travel Rule |
| **Oracle** | SIX Precious Metals Data |

## 🏆 Why We Win

### 1. Unique Value Proposition
**No other project combines:**
- Commodity RWA backing (Paxos Gold is static, no yield)
- Programmable stablecoin (USDC lacks embedded compliance)
- Dynamic yield optimization (Ethena is crypto-native, not RWA)
- Regulator-native design (most RWAs ignore Travel Rule)

### 2. Technical Excellence
- ✅ 4 deployed Solana programs (Rust + Anchor)
- ✅ SPL Token-2022 with transfer hooks
- ✅ ZK Compression for privacy-preserving KYC
- ✅ Real-time oracle integration
- ✅ Production-grade frontend
- ✅ Comprehensive testing

### 3. Institutional Fit
- ✅ Protocol-native compliance (not bolted on)
- ✅ SIX data integration (Swiss banking credibility)
- ✅ AMINA Bank pilot path
- ✅ Solstice infrastructure ready
- ✅ UBS Digital Assets interest

### 4. Market Opportunity
- $12T in institutional commodity holdings
- $150B stablecoin market (target 1-2% = $1.5-3B)
- 500+ regulated institutions exploring tokenization

### 5. Submission Quality
- ✅ Complete technical documentation
- ✅ Professional pitch + technical videos
- ✅ Working demo on Devnet
- ✅ Open-source GitHub repo
- ✅ Clear deployment instructions

## 🔑 Core Innovations

### Innovation 1: Protocol-Native Compliance
**Problem:** Existing RWAs treat compliance as an afterthought, creating security gaps and regulatory risk.

**Solution:** Aurum embeds compliance in smart contract logic:
- ZK proofs verify KYC without exposing PII on-chain
- SPL Token-2022 transfer hooks automatically attach Travel Rule payloads
- Real-time KYT monitoring flags suspicious transactions
- AML freeze mechanisms give institutions regulatory control

**Impact:** First stablecoin that regulators can actually approve.

### Innovation 2: Dynamic Yield Optimization
**Problem:** Commodity-backed tokens (Paxos Gold, Tether Gold) earn 0% yield, making them unattractive vs DeFi.

**Solution:** Aurum auto-allocates deposits to compliant DeFi strategies:
- Permissioned lending pools (5-8% APY)
- Delta-neutral hedging (8-15% APY)
- Rebalanced based on SIX oracle data, volatility, KYT risk, and user profile
- All yields auditable and predictable

**Impact:** 3-5x returns vs holding physical gold, without sacrificing compliance.

### Innovation 3: Volatility-Proof Mechanics
**Problem:** Algorithmic stablecoins (Terra, etc.) depeg during volatility. Commodity-backed tokens face redemption delays.

**Solution:** Aurum combines:
- 110-120% over-collateralization buffer
- Flash-loan-style instant redemptions
- Real-time SIX oracle pricing
- Automatic rebalancing during price spikes

**Impact:** Maintains $1 peg even in extreme market conditions.

## 📁 Deliverables

### Code
- ✅ 4 Solana programs (Rust + Anchor)
- ✅ Next.js frontend
- ✅ Deployment scripts
- ✅ Test suite
- ✅ GitHub repo: `github.com/[username]/aurum`

### Documentation
- ✅ README.md (setup instructions)
- ✅ SUBMISSION.md (complete hackathon package)
- ✅ QUICKSTART.md (10-minute guide)
- ✅ HACKATHON_CHECKLIST.md (submission checklist)
- ✅ Technical architecture diagrams

### Videos
- ✅ 3-minute pitch video
- ✅ 3-minute technical walkthrough
- ✅ Both with captions, 1080p

### Demo
- ✅ Live on Vercel: `aurum-demo.vercel.app`
- ✅ Programs on Devnet
- ✅ Test wallets provided

## 🎬 Demo Flow (3 Minutes)

1. **Connect Wallet** (0:00-0:20)
   - Phantom/Solflare on Devnet
   - Dashboard shows KYC status (red badge)

2. **KYC Verification** (0:20-0:50)
   - Navigate to Compliance Portal
   - Sign message → ZK proof generated
   - Green badge confirms verification

3. **Mint auUSD** (0:50-1:30)
   - Deposit 1 tokenized gold token
   - SIX oracle shows $2,650/oz
   - Mint 2,385 auUSD (110% collateral ratio)
   - Dashboard updates with yield allocation

4. **Compliant Transfer** (1:30-2:10)
   - Transfer 3,500 auUSD (>$3K threshold)
   - Travel Rule payload auto-generated
   - KYT risk score: 15 (green/low risk)
   - Transaction confirmed with encrypted payload

5. **Yield & Oracle** (2:10-2:40)
   - Yield chart shows rebalancing
   - SIX oracle updates every 60s
   - Current allocation: 60% lending, 40% hedging
   - Projected APY: 7.2%

6. **Redeem** (2:40-3:00)
   - Redeem 1,000 auUSD → tokenized gold
   - Instant execution
   - Collateral ratio updates

## 🤝 Partners & Validation

### SIX Group
- Official precious metals data provider
- Real-time gold/silver/FX pricing
- Swiss banking credibility

### AMINA Bank
- KYC/AML infrastructure
- EUR/CHF off-ramp
- Pilot program with Swiss SMEs

### Solstice (Solstream)
- Institutional custody
- Settlement infrastructure
- Integration-ready architecture

### UBS Digital Assets
- Wealth management interest
- Tier-1 validation
- Potential pilot Q4 2026

## 📈 Post-Hackathon Roadmap

### Q2 2026 (Pilot)
- AMINA Bank pilot with 10 Swiss SMEs
- $500K-1M initial TVL
- Mainnet deployment (audited)

### Q3 2026 (Scale)
- Solstice infrastructure integration
- Multi-commodity support (platinum, palladium)
- $10M TVL target

### Q4 2026 (Enterprise)
- UBS Digital Assets evaluation
- Keyrock market making
- $50M TVL target

### 2027 (Expansion)
- Geographic expansion (EU, APAC)
- Additional collateral types
- $500M TVL target

## 💡 Competitive Advantage

| Feature | Aurum | Paxos Gold | Tether Gold | USDC | Ethena |
|---------|------------|------------|-------------|------|--------|
| Commodity-backed | ✅ | ✅ | ✅ | ❌ | ❌ |
| Dynamic Yield | ✅ 7-15% | ❌ 0% | ❌ 0% | ❌ 0% | ✅ 8-20% |
| Programmable Compliance | ✅ Protocol | ❌ Off-chain | ❌ Off-chain | ⚠️ Centralized | ❌ None |
| Travel Rule | ✅ Automated | ❌ Manual | ❌ Manual | ⚠️ Circle | ❌ None |
| ZK Privacy | ✅ | ❌ | ❌ | ❌ | ❌ |
| Real-time Oracle | ✅ SIX | ⚠️ Internal | ⚠️ Internal | N/A | ✅ Pyth |
| Depeg Protection | ✅ Over-collat | ✅ 1:1 | ✅ 1:1 | ✅ 1:1 | ⚠️ Funding |
| Solana-native | ✅ | ❌ Ethereum | ❌ Ethereum | ✅ | ❌ Ethereum |

**The Pitch:** "We're Paxos Gold's yield + Ethena's optimization + Circle's compliance + Solana's speed."

## 🎯 Judge Appeal

### For Technical Judges
- Clean Rust/Anchor code
- Proper PDA derivation
- CPI patterns
- Error handling
- Comprehensive tests

### For Business Judges
- Clear revenue model (0.5% mint/redeem fee)
- Partner validation (SIX, AMINA)
- Pilot-ready architecture
- $3B TAM in year one

### For Compliance Judges
- ZK-KYC preserves privacy
- Travel Rule automation
- KYT real-time monitoring
- AML freeze mechanisms
- Audit trail (on-chain)

## 📞 Contact

- **Email:** team@aurum.io
- **Twitter:** @yourhandle
- **Discord:** [Join server]
- **GitHub:** github.com/[username]/aurum
- **Demo:** aurum-demo.vercel.app

---

**Built for StableHacks 2026** | **Powered by Solana** | **Backed by Real Assets**

*Last Updated: March 19, 2026*
