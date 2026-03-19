'use client'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { Coins, TrendingUp, ArrowUpRight, CheckCircle2, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { YieldChart } from '@/components/charts/YieldChart'
import { AllocationChart } from '@/components/charts/AllocationChart'
import { ActivityFeed } from '@/components/ActivityFeed'
import { AnimatedCard } from '@/components/AnimatedCard'
import { RiskScoreGauge } from '@/components/compliance/RiskScoreGauge'
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
  const { connected } = useWallet()
  const { connection } = useConnection()
  const wallet = useWallet()
  const [activeSection, setActiveSection] = useState<'overview' | 'vault' | 'compliance' | 'yield' | 'analytics'>('overview')

  // Real blockchain data hooks
  const { data: compliance, isLoading: complianceLoading } = useComplianceData()
  const { data: oracle, isLoading: oracleLoading } = useOracleData()
  const { data: yieldData, isLoading: yieldLoading } = useYieldStrategy()
  const { data: vault, isLoading: vaultLoading } = useVaultData()

  const handleStrategySelect = async (profile: RiskProfile) => {
    if (!wallet.publicKey || !wallet.signTransaction) return
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
            <Coins className="h-9 w-9 text-primary" strokeWidth={2.5} />
            <span className="text-3xl font-semibold gradient-text tracking-tight">Aurum</span>
          </Link>
          <WalletButton />
        </div>
      </header>

      {/* Main Navigation */}
      <div className="border-b border-border/40 glass sticky top-[73px] z-40">
        <div className="container mx-auto px-6 max-w-7xl">
          <nav className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'vault', label: 'Vault', icon: Coins },
              { id: 'compliance', label: 'Compliance', icon: Shield },
              { id: 'yield', label: 'Yield', icon: TrendingUp },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${
                  activeSection === section.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
                {activeSection === section.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <OverviewSection
            vault={vault}
            oracle={oracle}
            yieldData={yieldData}
            compliance={compliance}
            vaultLoading={vaultLoading}
            oracleLoading={oracleLoading}
            yieldLoading={yieldLoading}
            complianceLoading={complianceLoading}
          />
        )}
        
        {activeSection === 'vault' && (
          <VaultSection oracle={oracle} wallet={wallet} connection={connection} />
        )}
        
        {activeSection === 'compliance' && (
          <ComplianceSection compliance={compliance} complianceLoading={complianceLoading} wallet={wallet} connection={connection} />
        )}
        
        {activeSection === 'yield' && (
          <YieldSection yieldData={yieldData} yieldLoading={yieldLoading} onStrategySelect={handleStrategySelect} />
        )}
        
        {activeSection === 'analytics' && (
          <AnalyticsSection />
        )}
      </main>
    </div>
  )
}

// Section Components
function OverviewSection({ vault, oracle, yieldData, compliance, vaultLoading, oracleLoading, yieldLoading, complianceLoading }: any) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard delay={0}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">auUSD Balance</p>
              <p className="text-4xl font-bold gradient-text">
                {vaultLoading ? '...' : (vault?.userAuusdBalance?.toFixed(2) || '0.00')}
              </p>
            </div>
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={100}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Collateral Value</p>
              <p className="text-4xl font-bold gradient-text">
                ${vaultLoading ? '...' : ((vault?.totalCollateralValue || 0) / 1_000_000).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current APY</p>
              <p className="text-4xl font-bold gradient-text">
                {yieldLoading ? '...' : `${yieldData?.currentApy?.toFixed(1) || '0.0'}%`}
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-green-400" />
          </div>
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
              <p className="text-2xl font-bold text-foreground">
                {complianceLoading ? '...' : (compliance?.kycVerified ? 'Verified' : 'Pending')}
              </p>
            </div>
            <CheckCircle2 className={`h-8 w-8 ${compliance?.kycVerified ? 'text-green-400' : 'text-yellow-400'}`} />
          </div>
        </AnimatedCard>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PriceTickerWithAlerts
            prices={oracle || { goldPrice: 0, silverPrice: 0, eurUsdRate: 0, goldChange24h: 0, silverChange24h: 0, lastUpdate: 0, updateCount: 0, isStale: false }}
            isLoading={oracleLoading}
          />
          <YieldChart />
        </div>
        <div className="space-y-6">
          <CollateralHealthMeter
            currentRatio={vault?.currentCollateralRatio || 0}
            targetRatio={vault?.overCollateralRatio || 110}
            totalCollateralValue={vault?.totalCollateralValue || 0}
            goldValue={(vault?.totalCollateralValue || 0) * 0.6}
            silverValue={(vault?.totalCollateralValue || 0) * 0.4}
            isLoading={vaultLoading}
          />
          <AllocationChart />
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

function VaultSection({ oracle, wallet, connection }: any) {
  const [activeTab, setActiveTab] = useState<'mint' | 'redeem'>('mint')
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text">Vault Operations</h2>
      
      <div className="glass-strong rounded-2xl overflow-hidden">
        <div className="flex border-b border-border/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('mint')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'mint' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Mint auUSD
          </button>
          <button
            onClick={() => setActiveTab('redeem')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'redeem' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Redeem Collateral
          </button>
        </div>
        
        <div className="p-8">
          {activeTab === 'mint' ? (
            <div className="max-w-2xl mx-auto">
              <p className="text-muted-foreground mb-6">Deposit tokenized gold or silver to mint auUSD</p>
              {/* Mint form would go here */}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <p className="text-muted-foreground mb-6">Burn auUSD to redeem your collateral</p>
              {/* Redeem form would go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ComplianceSection({ compliance, complianceLoading, wallet, connection }: any) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text">Compliance & KYC</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <RiskScoreGauge
          riskScore={compliance?.riskScore || 0}
          txCount24h={compliance?.txCount24h || 0}
          lastCheck={compliance?.lastTxTimestamp || 0}
          isLoading={complianceLoading}
        />
        
        <div className="glass-strong rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Verification Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span>KYC Verified</span>
              <CheckCircle2 className={`h-5 w-5 ${compliance?.kycVerified ? 'text-green-400' : 'text-yellow-400'}`} />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span>KYT Monitoring</span>
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <span>Travel Rule</span>
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function YieldSection({ yieldData, yieldLoading, onStrategySelect }: any) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text">Yield Strategy</h2>
      
      <InteractiveStrategySelector
        currentStrategy={yieldData?.riskProfile || RiskProfile.Conservative}
        onSelect={onStrategySelect}
        isLoading={yieldLoading}
      />
      
      <YieldChart />
    </div>
  )
}

function AnalyticsSection() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-3xl font-bold gradient-text">Analytics & Reports</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <YieldChart />
        <AllocationChart />
      </div>
      
      <ActivityFeed />
    </div>
  )
}
