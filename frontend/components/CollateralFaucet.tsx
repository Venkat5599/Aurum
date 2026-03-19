'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Coins, Droplet } from 'lucide-react'

const GOLD_MINT = new PublicKey(process.env.NEXT_PUBLIC_GOLD_MINT || '11111111111111111111111111111111')
const SILVER_MINT = new PublicKey(process.env.NEXT_PUBLIC_SILVER_MINT || '11111111111111111111111111111111')

export function CollateralFaucet() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [goldBalance, setGoldBalance] = useState<number>(0)
  const [silverBalance, setSilverBalance] = useState<number>(0)
  const [loading, setLoading] = useState<'gold' | 'silver' | null>(null)

  // Fetch balances
  useEffect(() => {
    if (!publicKey) return

    const fetchBalances = async () => {
      try {
        // Gold balance
        const goldAta = await getAssociatedTokenAddress(GOLD_MINT, publicKey)
        try {
          const goldAccount = await getAccount(connection, goldAta)
          setGoldBalance(Number(goldAccount.amount) / 1_000_000)
        } catch {
          setGoldBalance(0)
        }

        // Silver balance
        const silverAta = await getAssociatedTokenAddress(SILVER_MINT, publicKey)
        try {
          const silverAccount = await getAccount(connection, silverAta)
          setSilverBalance(Number(silverAccount.amount) / 1_000_000)
        } catch {
          setSilverBalance(0)
        }
      } catch (error) {
        console.error('Error fetching balances:', error)
      }
    }

    fetchBalances()
    const interval = setInterval(fetchBalances, 10000)
    return () => clearInterval(interval)
  }, [publicKey, connection])

  const requestTokens = async (tokenType: 'gold' | 'silver') => {
    if (!publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    setLoading(tokenType)
    try {
      toast.loading(`Requesting ${tokenType === 'gold' ? 'mGOLD' : 'mSILVER'} tokens...`)

      // Call backend API to mint tokens
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: publicKey.toString(),
          tokenType,
        }),
      })

      if (!response.ok) {
        throw new Error('Faucet request failed')
      }

      const { signature } = await response.json()

      toast.success(`${tokenType === 'gold' ? '10 mGOLD' : '100 mSILVER'} tokens received!`, {
        description: 'Check your wallet balance',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
        }
      })

      // Refresh balances
      setTimeout(() => {
        if (tokenType === 'gold') {
          setGoldBalance(prev => prev + 10)
        } else {
          setSilverBalance(prev => prev + 100)
        }
      }, 2000)
    } catch (error: any) {
      console.error('Faucet error:', error)
      toast.error('Failed to request tokens', {
        description: error.message || 'Please try again'
      })
    } finally {
      setLoading(null)
    }
  }

  if (!publicKey) {
    return (
      <div className="glass-strong rounded-2xl p-8 text-center">
        <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Collateral Faucet</h3>
        <p className="text-muted-foreground">Connect your wallet to request test tokens</p>
      </div>
    )
  }

  return (
    <div className="glass-strong rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 glass rounded-xl glow">
          <Droplet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">Collateral Faucet</h3>
          <p className="text-sm text-muted-foreground">Request test tokens for minting auUSD</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Gold Faucet */}
        <div className="bg-muted/30 border border-border/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div>
                <h4 className="font-semibold text-foreground">Mock Gold (mGOLD)</h4>
                <p className="text-sm text-muted-foreground">Tokenized gold for testing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{goldBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Your Balance</p>
            </div>
          </div>
          <button
            onClick={() => requestTokens('gold')}
            disabled={loading !== null}
            className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 font-medium px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'gold' ? 'Requesting...' : 'Request 10 mGOLD'}
          </button>
        </div>

        {/* Silver Faucet */}
        <div className="bg-muted/30 border border-border/40 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-gray-400" />
              <div>
                <h4 className="font-semibold text-foreground">Mock Silver (mSILVER)</h4>
                <p className="text-sm text-muted-foreground">Tokenized silver for testing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{silverBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Your Balance</p>
            </div>
          </div>
          <button
            onClick={() => requestTokens('silver')}
            disabled={loading !== null}
            className="w-full bg-gray-400/10 hover:bg-gray-400/20 border border-gray-400/30 text-gray-300 font-medium px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === 'silver' ? 'Requesting...' : 'Request 100 mSILVER'}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Note:</strong> These are test tokens for demo purposes. Each request gives you enough collateral to mint auUSD. Faucet limits: once per hour per wallet.
        </p>
      </div>
    </div>
  )
}
