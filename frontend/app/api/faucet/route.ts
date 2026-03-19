import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

const FAUCET_AMOUNT_GOLD = 10 * 1_000_000 // 10 mGOLD
const FAUCET_AMOUNT_SILVER = 100 * 1_000_000 // 100 mSILVER
const RATE_LIMIT_HOURS = 1

// In-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const { recipient, tokenType } = await request.json()

    if (!recipient || !tokenType) {
      return NextResponse.json(
        { error: 'Missing recipient or tokenType' },
        { status: 400 }
      )
    }

    // Rate limiting
    const now = Date.now()
    const lastRequest = rateLimitMap.get(recipient)
    if (lastRequest && now - lastRequest < RATE_LIMIT_HOURS * 60 * 60 * 1000) {
      const minutesLeft = Math.ceil((RATE_LIMIT_HOURS * 60 * 60 * 1000 - (now - lastRequest)) / 60000)
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      )
    }

    // Setup connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    )

    // Load authority keypair (in production, use secure key management)
    const walletPath = process.env.FAUCET_KEYPAIR_PATH ||
      (process.env.HOME + '/.config/solana/id.json')
    const walletKeypair = Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
    )

    // Load mint addresses
    const configPath = path.join(process.cwd(), '.collateral-config.json')
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Faucet not initialized. Run: yarn run ts-node scripts/create-collateral-faucet.ts' },
        { status: 500 }
      )
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    const mint = new PublicKey(
      tokenType === 'gold' ? config.goldMint : config.silverMint
    )
    const amount = tokenType === 'gold' ? FAUCET_AMOUNT_GOLD : FAUCET_AMOUNT_SILVER

    // Get or create recipient's token account
    const recipientPubkey = new PublicKey(recipient)
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletKeypair,
      mint,
      recipientPubkey
    )

    // Mint tokens
    const signature = await mintTo(
      connection,
      walletKeypair,
      mint,
      recipientTokenAccount.address,
      walletKeypair,
      amount
    )

    // Update rate limit
    rateLimitMap.set(recipient, now)

    return NextResponse.json({
      success: true,
      signature,
      amount: tokenType === 'gold' ? 10 : 100,
      tokenType,
    })
  } catch (error: any) {
    console.error('Faucet error:', error)
    return NextResponse.json(
      { error: error.message || 'Faucet request failed' },
      { status: 500 }
    )
  }
}
