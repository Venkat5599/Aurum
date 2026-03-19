/**
 * Create collateral token faucet
 * Allows users to request test mGOLD and mSILVER tokens for testing
 *
 * Usage: ts-node scripts/create-collateral-faucet.ts
 */

import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
} from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

const FAUCET_AMOUNT_GOLD = 10 * 1_000_000 // 10 mGOLD tokens (6 decimals)
const FAUCET_AMOUNT_SILVER = 100 * 1_000_000 // 100 mSILVER tokens (6 decimals)

async function main() {
  console.log('🚰 Creating Collateral Token Faucet')
  console.log('====================================\n')

  // Setup
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  const walletPath = process.env.HOME + '/.config/solana/id.json'
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  )

  console.log('👤 Authority:', walletKeypair.publicKey.toString())
  console.log('💰 Balance:', await connection.getBalance(walletKeypair.publicKey) / LAMPORTS_PER_SOL, 'SOL\n')

  // Check if mints already exist
  const configPath = path.join(__dirname, '../.collateral-config.json')
  let goldMint: PublicKey
  let silverMint: PublicKey

  if (fs.existsSync(configPath)) {
    console.log('📋 Loading existing token mints...')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    goldMint = new PublicKey(config.goldMint)
    silverMint = new PublicKey(config.silverMint)
    console.log('✅ mGOLD:', goldMint.toString())
    console.log('✅ mSILVER:', silverMint.toString(), '\n')
  } else {
    // Create new mints
    console.log('🪙 Creating mGOLD token mint...')
    goldMint = await createMint(
      connection,
      walletKeypair,
      walletKeypair.publicKey, // mint authority
      walletKeypair.publicKey, // freeze authority
      6, // decimals
    )
    console.log('✅ mGOLD mint created:', goldMint.toString())

    console.log('🪙 Creating mSILVER token mint...')
    silverMint = await createMint(
      connection,
      walletKeypair,
      walletKeypair.publicKey,
      walletKeypair.publicKey,
      6,
    )
    console.log('✅ mSILVER mint created:', silverMint.toString(), '\n')

    // Save configuration
    const config = {
      goldMint: goldMint.toString(),
      silverMint: silverMint.toString(),
      authority: walletKeypair.publicKey.toString(),
      createdAt: new Date().toISOString(),
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('💾 Configuration saved to .collateral-config.json\n')
  }

  // Update frontend .env
  console.log('📝 Updating frontend environment...')
  const envPath = path.join(__dirname, '../frontend/.env.local')
  let envContent = ''

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8')

    // Update or add collateral mint addresses
    if (envContent.includes('NEXT_PUBLIC_GOLD_MINT=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_GOLD_MINT=.*/g, `NEXT_PUBLIC_GOLD_MINT=${goldMint.toString()}`)
    } else {
      envContent += `\n# Collateral Token Mints\nNEXT_PUBLIC_GOLD_MINT=${goldMint.toString()}\n`
    }

    if (envContent.includes('NEXT_PUBLIC_SILVER_MINT=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_SILVER_MINT=.*/g, `NEXT_PUBLIC_SILVER_MINT=${silverMint.toString()}`)
    } else {
      envContent += `NEXT_PUBLIC_SILVER_MINT=${silverMint.toString()}\n`
    }
  } else {
    envContent = `# Collateral Token Mints
NEXT_PUBLIC_GOLD_MINT=${goldMint.toString()}
NEXT_PUBLIC_SILVER_MINT=${silverMint.toString()}
`
  }

  fs.writeFileSync(envPath, envContent)
  console.log('✅ Frontend .env.local updated\n')

  console.log('🎉 Faucet Setup Complete!')
  console.log('=========================')
  console.log('mGOLD Mint:', goldMint.toString())
  console.log('mSILVER Mint:', silverMint.toString())
  console.log('\n💡 Users can now request test tokens via the frontend faucet')
  console.log('   Each request gives: 10 mGOLD or 100 mSILVER')
}

/**
 * Airdrop tokens to a user (called by frontend)
 */
export async function airdropCollateral(
  connection: Connection,
  recipient: PublicKey,
  tokenType: 'gold' | 'silver'
): Promise<string> {
  const walletPath = process.env.HOME + '/.config/solana/id.json'
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  )

  // Load mint addresses
  const configPath = path.join(__dirname, '../.collateral-config.json')
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

  const mint = new PublicKey(tokenType === 'gold' ? config.goldMint : config.silverMint)
  const amount = tokenType === 'gold' ? FAUCET_AMOUNT_GOLD : FAUCET_AMOUNT_SILVER

  // Get or create recipient's token account
  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mint,
    recipient
  )

  // Mint tokens to recipient
  const signature = await mintTo(
    connection,
    walletKeypair,
    mint,
    recipientTokenAccount.address,
    walletKeypair,
    amount
  )

  return signature
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}
