/**
 * Update oracle prices (simulates SIX data feed)
 * Run this periodically to update gold/silver prices
 *
 * Usage: ts-node scripts/update-oracle-prices.ts
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor'
import * as fs from 'fs'
import * as path from 'path'

const oracleIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/oracle.json'), 'utf-8'))
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp')

async function main() {
  console.log('📊 Updating oracle prices...\n')

  // Setup
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  const walletPath = process.env.HOME + '/.config/solana/id.json'
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  )
  const wallet = new Wallet(walletKeypair)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  const program = new Program(oracleIdl, ORACLE_PROGRAM_ID, provider)

  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), wallet.publicKey.toBuffer()],
    ORACLE_PROGRAM_ID
  )

  // Fetch current prices (or use mock data)
  // In production, fetch from SIX API
  const goldPrice = new BN(Math.floor((2650 + Math.random() * 100 - 50) * 100000000)) // $2600-$2700
  const silverPrice = new BN(Math.floor((31.5 + Math.random() * 2 - 1) * 100000000)) // $30.5-$32.5
  const eurUsdRate = new BN(Math.floor((1.08 + Math.random() * 0.04 - 0.02) * 100000000)) // 1.06-1.10

  console.log('New prices:')
  console.log('  Gold:', (goldPrice.toNumber() / 100000000).toFixed(2), 'USD/oz')
  console.log('  Silver:', (silverPrice.toNumber() / 100000000).toFixed(2), 'USD/oz')
  console.log('  EUR/USD:', (eurUsdRate.toNumber() / 100000000).toFixed(4), '\n')

  const tx = await program.methods
    .updatePrices(goldPrice, silverPrice, eurUsdRate)
    .accounts({
      oracleData: oraclePDA,
      authority: wallet.publicKey,
    })
    .rpc()

  console.log('✅ Prices updated!')
  console.log('📝 Transaction:', tx)
  console.log(`🌐 https://explorer.solana.com/tx/${tx}?cluster=devnet`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
