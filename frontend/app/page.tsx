'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '@/components/WalletButton'
import { Coins, Shield, TrendingUp, Zap, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="border-b border-border/40 glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="relative animate-float">
              <Coins className="h-9 w-9 text-primary" strokeWidth={2.5} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-glow-pulse" />
            </div>
            <span className="text-3xl font-semibold gradient-text tracking-tight">Aurum</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 mr-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition">Features</Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition">How it Works</Link>
            <Link href="#partners" className="text-sm text-muted-foreground hover:text-primary transition">Partners</Link>
          </nav>
          <WalletButton />
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative container mx-auto px-6 py-32 max-w-7xl overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          </div>

          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 glass-strong rounded-full glow">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">StableHacks 2026 Submission</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-bold mb-8 tracking-tight leading-[1.05]">
              <span className="gradient-text">Regulator-native</span>
              <br />
              <span className="text-foreground">programmable vault</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              The first stablecoin backed by tokenized precious metals with <span className="text-primary font-semibold">protocol-level compliance</span> and dynamic yield optimization. Built for institutions on Solana.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              {connected ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 text-primary-foreground font-semibold px-10 py-5 rounded-xl transition shadow-lg glow-strong"
                >
                  Open Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 glass text-muted-foreground font-medium px-10 py-5 rounded-xl">
                  Connect wallet to get started
                </div>
              )}
              <Link
                href="#features"
                className="inline-flex items-center gap-2 glass-strong hover:glass text-foreground font-medium px-10 py-5 rounded-xl transition"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-border/40 glass">
          <div className="container mx-auto px-6 py-16 max-w-7xl">
            <div className="grid md:grid-cols-3 gap-12">
              <StatCard label="Total Value Locked" value="$0.00" subtext="Devnet Demo" />
              <StatCard label="Collateral Ratio" value="110%" subtext="Over-collateralized" />
              <StatCard label="Current APY" value="7.2%" subtext="Dynamic yield" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="container mx-auto px-6 py-32 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">Built for regulated</span>
              <br />
              <span className="text-foreground">institutions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compliance and yield optimization embedded at the protocol level
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-primary" strokeWidth={1.5} />}
              title="Protocol-Native Compliance"
              description="Zero-knowledge proofs for privacy-preserving KYC attestations. Real-time KYT monitoring and AML flagging. Automatic Travel Rule payload attachment via SPL Token-2022 transfer hooks."
            />
            <FeatureCard
              icon={<TrendingUp className="h-12 w-12 text-primary" strokeWidth={1.5} />}
              title="Dynamic Yield Optimization"
              description="Auto-allocates to compliant DeFi strategies (7-15% APY). Rebalances based on SIX oracle data, volatility, and KYT risk scores. Institutional risk profiles available."
            />
            <FeatureCard
              icon={<Coins className="h-12 w-12 text-primary" strokeWidth={1.5} />}
              title="Commodity-Backed Stability"
              description="Fully collateralized by tokenized gold and silver. Real-time SIX precious metals pricing. 110-120% over-collateralization buffer for volatility protection."
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-primary" strokeWidth={1.5} />}
              title="Instant Redemptions"
              description="Flash-loan-style instant redemptions back to tokenized commodities. Maintains $1 peg even in extreme market conditions. Built on Solana for speed."
            />
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="glass border-y border-border/40">
          <div className="container mx-auto px-6 py-32 max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="text-foreground">How it </span>
                <span className="gradient-text">works</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <StepCard number="1" title="Complete KYC" description="Verify your identity with zero-knowledge proofs. Your data stays private while meeting regulatory requirements." />
              <StepCard number="2" title="Mint auUSD" description="Deposit tokenized gold or silver. Receive auUSD at current SIX oracle prices with instant confirmation." />
              <StepCard number="3" title="Earn Yield" description="Your deposits are automatically allocated to compliant strategies. Redeem anytime with instant settlement." />
            </div>
          </div>
        </section>

        {/* Partners */}
        <section id="partners" className="container mx-auto px-6 py-32 max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="text-foreground">Trusted </span>
              <span className="gradient-text">partners</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with institutional-grade infrastructure
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 items-center justify-items-center">
            <PartnerCard name="SIX Group" role="Precious metals data" />
            <PartnerCard name="AMINA Bank" role="KYC/AML infrastructure" />
            <PartnerCard name="Solstice" role="Institutional custody" />
            <PartnerCard name="Solana" role="Blockchain infrastructure" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 glass">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Coins className="h-7 w-7 text-primary" strokeWidth={2.5} />
              <span className="text-xl font-semibold gradient-text">Aurum</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for StableHacks 2026 • Powered by Solana • Backed by Real Assets
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-strong rounded-2xl p-8 card-hover group">
      <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-2xl font-semibold text-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-3">{label}</p>
      <p className="text-5xl font-bold gradient-text mb-2">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-strong glow text-primary font-bold text-xl mb-6">
        {number}
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function PartnerCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center p-8 rounded-2xl glass-strong card-hover w-full">
      <p className="font-semibold text-foreground mb-2">{name}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  )
}
