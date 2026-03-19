'use client'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { Coins, TrendingUp, ArrowUpRight, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { YieldChart } from '@/components/charts/YieldChart'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { ActivityFeed } from '@/components/ActivityFeed'
import { AnimatedCard } from '@/components/AnimatedCard'
import { RiskScoreGauge } from '@/components/compliance/RiskScoreGauge'
import { TravelRuleIndicator } from '@/components/compliance/TravelRuleIndicator'
import { PriceTickerWithAlerts } from '@/components/oracle/PriceTickerWithAlerts'
import { InteractiveStrategySelector } from '@/components/yield/InteractiveStrategySelector'
import { CollateralHealthMeter } from '@/components/vault/CollateralHealthMeter'
import { useComplianceData } from '@/lib/hooks/useComplianceData'
import { useOracleData } from '@/lib/hooks/useOracleData'
import { useYieldStrategy } from '@/lib/hooks/useYieldStrategy'
import { useVaultData } from '@/lib/hooks/useVaultData'
import { RiskProfile } from '@/lib/types/programs'
import { mintAuusd, redeemAuusd } from '@/lib/transactions/vault'
import { verifyKyc } from '@/lib/transactions/compliance'
import { initializeStrategy } from '@/lib/transactions/yield'

export default function Dashboard() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const [activeTab, setActiveTab] = useState<'mint' | 'redeem' | 'compliance' | 'yield'>('mint')

  // Real blockchain data hooks
  const { data: compliance, isLoading: complianceLoading } = useComplianceData()
  const { data: oracle, isLoading: oracleLoading } = useOracleData()
  const { data: yieldData, isLoading: yieldLoading } = useYieldStrategy()
  const { data: vault, isLoading: vaultLoading } = useVaultData()

  const handleStrategySelect = async (profile: RiskProfile) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return
    }

    try {
      await initializeStrategy(connection, wallet as any, profile)
    } catch (error) {
      console.error('Strategy initialization error:', error)
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <Coins className="h-20 w-20 text-primary mx-auto animate-float" />
            <div className="absolute inset-0 blur-xl bg-primary/30 animate-glow-pulse" />
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-3">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-8">Please connect your wallet to access the dashboard</p>
          <WalletButton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/40 glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center max-w-7xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative animate-float">
              <Coins className="h-9 w-9 text-primary" strokeWidth={2.5} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-glow-pulse" />
            </div>
            <span className="text-3xl font-semibold gradient-text tracking-tight">Aurum</span>
          </Link>
          <WalletButton />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Enhanced Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnimatedCard delay={0}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">auUSD Balance</p>
                <p className="text-4xl font-bold gradient-text">
                  {vaultLoading ? '...' : (vault?.userAuusdBalance?.toFixed(2) || '0.00')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${vaultLoading ? '...' : (vault?.userAuusdBalance?.toFixed(2) || '0.00')} USD
                </p>
              </div>
              <div className="p-3 glass rounded-xl glow">
                <Coins className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-muted-foreground">Live balance</span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={100}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Collateral Value</p>
                <p className="text-4xl font-bold gradient-text">
                  {vaultLoading ? '...' : `$${((vault?.totalCollateralValue || 0) / 1_000_000).toFixed(2)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Gold + Silver</p>
              </div>
              <div className="p-3 glass rounded-xl glow">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-400">+{oracle?.goldChange24h?.toFixed(1) || '0.0'}%</span>
              <span className="text-muted-foreground">24h change</span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={200}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current APY</p>
                <p className="text-4xl font-bold gradient-text">
                  {yieldLoading ? '...' : `${yieldData?.currentApy?.toFixed(1) || '0.0'}%`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dynamic yield</p>
              </div>
              <div className="p-3 glass rounded-xl glow">
                <ArrowUpRight className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-muted-foreground">Live APY</span>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={300}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
                <p className="text-4xl font-bold text-foreground">
                  {complianceLoading ? '...' : (compliance?.kycVerified ? 'Verified' : 'Pending')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {complianceLoading ? '' : (compliance?.kycVerified ? 'Compliant' : 'Verification needed')}
                </p>
              </div>
              <div className="p-3 glass rounded-xl glow">
                <CheckCircle2 className={`h-6 w-6 ${compliance?.kycVerified ? 'text-green-400' : 'text-yellow-400'}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-muted-foreground">Real-time monitoring</span>
            </div>
          </AnimatedCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Tabs */}
            <div className="glass-strong rounded-2xl overflow-hidden">
              <div className="border-b border-border/40 glass">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('mint')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                      activeTab === 'mint'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    Mint
                  </button>
                  <button
                    onClick={() => setActiveTab('redeem')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                      activeTab === 'redeem'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    Redeem
                  </button>
                  <button
                    onClick={() => setActiveTab('compliance')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                      activeTab === 'compliance'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    Compliance
                  </button>
                  <button
                    onClick={() => setActiveTab('yield')}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
                      activeTab === 'yield'
                        ? 'text-primary border-b-2 border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    Yield
                  </button>
                </div>
              </div>

              <div className="p-8">
                {activeTab === 'mint' && <MintTab oracle={oracle} />}
                {activeTab === 'redeem' && <RedeemTab oracle={oracle} />}
                {activeTab === 'compliance' && (
                  <div className="space-y-6">
                    <RiskScoreGauge
                      riskScore={compliance?.riskScore || 0}
                      txCount24h={compliance?.txCount24h || 0}
                      lastCheck={compliance?.lastTxTimestamp || 0}
                      isLoading={complianceLoading}
                    />
                    <ComplianceTab />
                  </div>
                )}
                {activeTab === 'yield' && (
                  <InteractiveStrategySelector
                    currentStrategy={yieldData?.riskProfile || RiskProfile.Conservative}
                    onSelect={handleStrategySelect}
                    isLoading={yieldLoading}
                  />
                )}
              </div>
            </div>

            {/* Charts Section */}
            <YieldChart />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Oracle Prices with Alerts */}
            <PriceTickerWithAlerts
              prices={oracle || { goldPrice: 0, silverPrice: 0, eurUsdRate: 0, goldChange24h: 0, silverChange24h: 0, lastUpdate: 0, updateCount: 0, isStale: false }}
              isLoading={oracleLoading}
            />

            {/* Collateral Health */}
            <CollateralHealthMeter
              currentRatio={vault?.currentCollateralRatio || 0}
              targetRatio={vault?.overCollateralRatio || 110}
              totalCollateralValue={vault?.totalCollateralValue || 0}
              goldValue={(vault?.totalCollateralValue || 0) * 0.6}
              silverValue={(vault?.totalCollateralValue || 0) * 0.4}
              isLoading={vaultLoading}
            />

            {/* Allocation Chart */}
            <AllocationChart />

            {/* Activity Feed */}
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-6 py-4 text-sm font-medium transition-all ${
        active
          ? 'text-foreground border-b-2 border-primary bg-background'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      {children}
    </button>
  )
}

function MintTab({ oracle }: { oracle: any }) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [amount, setAmount] = useState('')
  const [collateralType, setCollateralType] = useState<'gold' | 'silver'>('gold')
  const [isLoading, setIsLoading] = useState(false)
  const amountNum = parseFloat(amount) || 0

  const price = collateralType === 'gold' ? (oracle?.goldPrice || 0) : (oracle?.silverPrice || 0)
  const collateralRatio = 1.1 // 110%
  const auusdReceived = price > 0 ? (amountNum * price) / collateralRatio : 0

  const handleMint = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return
    }

    if (amountNum <= 0) {
      return
    }

    setIsLoading(true)
    try {
      await mintAuusd(connection, wallet as any, amountNum, collateralType)
      setAmount('')
    } catch (error) {
      console.error('Mint error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-medium text-foreground mb-2">Mint auUSD</h3>
        <p className="text-muted-foreground">Deposit tokenized gold or silver to mint auUSD</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Collateral Type</label>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value as 'gold' | 'silver')}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          >
            <option value="gold">Tokenized Gold (XAU)</option>
            <option value="silver">Tokenized Silver (XAG)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              {collateralType === 'gold' ? 'XAU' : 'XAG'}
            </span>
          </div>
        </div>

        {/* Travel Rule Indicator */}
        {auusdReceived > 3000 && <TravelRuleIndicator amount={auusdReceived * 1_000_000} />}

        <div className="bg-muted/50 border border-border/40 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Oracle Price</span>
            <span className="text-foreground font-medium">${price.toFixed(2)}/oz</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Collateral Ratio</span>
            <span className="text-foreground font-medium">110%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">You will receive</span>
            <span className="text-foreground font-medium">~{auusdReceived.toFixed(2)} auUSD</span>
          </div>
        </div>

        <button
          onClick={handleMint}
          disabled={isLoading || amountNum <= 0 || !price}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Minting...' : 'Mint auUSD'}
        </button>
      </div>
    </div>
  )
}

function RedeemTab({ oracle }: { oracle: any }) {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [amount, setAmount] = useState('')
  const [collateralType, setCollateralType] = useState<'gold' | 'silver'>('gold')
  const [isLoading, setIsLoading] = useState(false)
  const amountNum = parseFloat(amount) || 0

  const price = collateralType === 'gold' ? (oracle?.goldPrice || 0) : (oracle?.silverPrice || 0)
  const redemptionFee = 0.005 // 0.5%
  const amountAfterFee = amountNum * (1 - redemptionFee)
  const collateralReceived = price > 0 ? amountAfterFee / price : 0

  const handleRedeem = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return
    }

    if (amountNum <= 0) {
      return
    }

    setIsLoading(true)
    try {
      await redeemAuusd(connection, wallet as any, amountNum, collateralType)
      setAmount('')
    } catch (error) {
      console.error('Redeem error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-medium text-foreground mb-2">Redeem Collateral</h3>
        <p className="text-muted-foreground">Burn auUSD to redeem your tokenized commodities</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">auUSD Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">auUSD</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Receive As</label>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value as 'gold' | 'silver')}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          >
            <option value="gold">Tokenized Gold (XAU)</option>
            <option value="silver">Tokenized Silver (XAG)</option>
          </select>
        </div>

        <div className="bg-muted/50 border border-border/40 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Oracle Price</span>
            <span className="text-foreground font-medium">${price.toFixed(2)}/oz</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">You will receive</span>
            <span className="text-foreground font-medium">
              ~{collateralReceived.toFixed(4)} {collateralType === 'gold' ? 'XAU' : 'XAG'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Redemption Fee</span>
            <span className="text-foreground font-medium">0.5%</span>
          </div>
        </div>

        <button
          onClick={handleRedeem}
          disabled={isLoading || amountNum <= 0 || !price}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Redeeming...' : 'Redeem Collateral'}
        </button>
      </div>
    </div>
  )
}

function ComplianceTab() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerifyKyc = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return
    }

    setIsVerifying(true)
    try {
      await verifyKyc(connection, wallet as any)
    } catch (error) {
      console.error('KYC verification error:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xl font-medium text-foreground mb-2">Compliance Status</h3>
        <p className="text-muted-foreground">Your verification and compliance information</p>
      </div>

      <div className="space-y-4">
        <ComplianceItem
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          title="KYC Verified"
          description="Your identity has been verified with zero-knowledge proofs"
          status="Active"
        />
        <ComplianceItem
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          title="KYT Monitoring"
          description="Real-time transaction monitoring enabled"
          status="Low Risk"
        />
        <ComplianceItem
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          title="Travel Rule"
          description="Automatic compliance for transfers >$3,000"
          status="Enabled"
        />
      </div>

      <button
        onClick={handleVerifyKyc}
        disabled={isVerifying}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isVerifying ? 'Verifying...' : 'Verify KYC with Zero-Knowledge Proof'}
      </button>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Privacy Protected:</strong> Your personal data is never stored on-chain. We use zero-knowledge proofs to verify compliance without exposing your information.
        </p>
      </div>
    </div>
  )
}

function ComplianceItem({ icon, title, description, status }: { icon: React.ReactNode; title: string; description: string; status: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border/40 rounded-lg hover:border-border transition">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-medium text-foreground">{title}</h4>
          <span className="text-xs px-2 py-1 bg-background border border-border rounded-full text-foreground">{status}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
