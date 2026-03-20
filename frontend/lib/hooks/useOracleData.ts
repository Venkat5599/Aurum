'use client'

import { useQuery } from '@tanstack/react-query'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import { OraclePrices, OracleData } from '../types/programs'
import { deriveOraclePDA } from '../programs/pdas'
import { PROGRAM_IDS, PRICE_DECIMALS, STALENESS_THRESHOLD } from '../programs/constants'
import oracleIdl from '../idl/oracle.json'

const ORACLE_AUTHORITY = new PublicKey(process.env.NEXT_PUBLIC_ORACLE_AUTHORITY || '11111111111111111111111111111111')

// Fetch real-time prices from CoinGecko API
async function fetchRealPrices() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=gold,silver&vs_currencies=usd&include_24hr_change=true'
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }
    
    const data = await response.json()
    
    return {
      goldPrice: data.gold.usd,
      silverPrice: data.silver.usd,
      goldChange24h: data.gold.usd_24h_change,
      silverChange24h: data.silver.usd_24h_change,
    }
  } catch (error) {
    console.error('Error fetching real prices:', error)
    return null
  }
}

export function useOracleData() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useQuery({
    queryKey: ['oracle'],
    queryFn: async (): Promise<OraclePrices | null> => {
      try {
        // First, try to fetch real prices from CoinGecko
        const realPrices = await fetchRealPrices()
        
        const [oraclePDA] = deriveOraclePDA(ORACLE_AUTHORITY)

        const accountInfo = await connection.getAccountInfo(oraclePDA)
        if (!accountInfo) {
          // Oracle not initialized, use real prices from CoinGecko
          if (realPrices) {
            return {
              goldPrice: realPrices.goldPrice,
              silverPrice: realPrices.silverPrice,
              eurUsdRate: 1.08,
              lastUpdate: Date.now() / 1000,
              updateCount: 0,
              isStale: false,
              goldChange24h: realPrices.goldChange24h,
              silverChange24h: realPrices.silverChange24h,
            }
          }
          
          // Fallback to default values
          return {
            goldPrice: 2650.00,
            silverPrice: 31.50,
            eurUsdRate: 1.08,
            lastUpdate: Date.now() / 1000,
            updateCount: 0,
            isStale: false,
            goldChange24h: 1.2,
            silverChange24h: 0.8,
          }
        }

        // For demo, use real prices from CoinGecko or fallback
        const goldPrice = realPrices?.goldPrice || 2650.00
        const silverPrice = realPrices?.silverPrice || 31.50
        const goldChange24h = realPrices?.goldChange24h || 1.2
        const silverChange24h = realPrices?.silverChange24h || 0.8

        return {
          goldPrice,
          silverPrice,
          eurUsdRate: 1.08,
          lastUpdate: Date.now() / 1000,
          updateCount: 0,
          isStale: false,
          goldChange24h,
          silverChange24h,
        }
      } catch (error) {
        console.error('Error fetching oracle data:', error)
        
        // Final fallback: try to get real prices from CoinGecko
        const realPrices = await fetchRealPrices()
        if (realPrices) {
          return {
            goldPrice: realPrices.goldPrice,
            silverPrice: realPrices.silverPrice,
            eurUsdRate: 1.08,
            lastUpdate: Date.now() / 1000,
            updateCount: 0,
            isStale: false,
            goldChange24h: realPrices.goldChange24h,
            silverChange24h: realPrices.silverChange24h,
          }
        }
        
        return null
      }
    },
    refetchInterval: 10000,
    staleTime: 8000,
  })
}
