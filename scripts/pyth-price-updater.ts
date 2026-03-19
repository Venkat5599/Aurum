/**
 * Automated Pyth price updater
 * Fetches prices from Pyth Network and updates the oracle
 *
 * Usage: ts-node scripts/pyth-price-updater.ts
 * For continuous updates: ts-node scripts/pyth-price-updater.ts --watch
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { PythHttpClient, getPythProgramKeyForCluster } from '@pythnetwork/client'
import * as fs from 'fs'
import * as path from 'path'

const oracleIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/oracle.json'), 'utf-8'))
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp')

// Pyth price feed IDs (Devnet)
const PYTH_GOLD_FEED = new PublicKey('JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB') // XAU/USD
const PYTH_SILVER_FEED = new PublicKey('BjHoZWRxo9dgbR1NQhPyTiUs6xFiX6mGS4TMYvy3b2yc') // XAG/USD

async function updatePrices(watch: boolean = false) {
  console.log('📊 Pyth Price Updater')
  console.log('=====================\n')

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

  // Initialize Pyth client
  const pythClient = new PythHttpClient(connection, getPythProgramKeyForCluster('devnet'))

  const update = async () => {
    try {
      console.log('🔄 Fetching prices from Pyth Network...')

      // Fetch price data
      const pythData = await pythClient.getData()

      // Get gold and silver prices
      const goldProduct = pythData.productPrice.get(PYTH_GOLD_FEED.toString())
      const silverProduct = pythData.productPrice.get(PYTH_SILVER_FEED.toString())

      if (!goldProduct || !silverProduct) {
        console.log('⚠️  Pyth feeds not available, using fallback...')
        // Fallback to manual update with mock prices
        await updateManually()
        return
      }

      console.log('Gold (XAU/USD):', goldProduct.price, goldProduct.confidence)
      console.log('Silver (XAG/USD):', silverProduct.price, silverProduct.confidence)

      // Update oracle with Pyth data
      const tx = await program.methods
        .updatePricesFromPyth()
        .accounts({
          oracleData: oraclePDA,
          authority: wallet.publicKey,
          goldPriceFeed: PYTH_GOLD_FEED,
          silverPriceFeed: PYTH_SILVER_FEED,
        })
        .rpc()

      console.log('✅ Prices updated from Pyth!')
      console.log('📝 Transaction:', tx)
      console.log(`🌐 https://explorer.solana.com/tx/${tx}?cluster=devnet\n`)
    } catch (error: any) {
      console.error('❌ Error updating from Pyth:', error.message)
      console.log('⚠️  Falling back to manual update...')
      await updateManually()
    }
  }

  // Fallback manual update
  const updateManually = async () => {
    try {
      // Fetch prices from external API or use mock data
      const goldPrice = Math.floor((2650 + Math.random() * 100 - 50) * 100000000)
      const silverPrice = Math.floor((31.5 + Math.random() * 2 - 1) * 100000000)
      const eurUsdRate = Math.floor((1.08 + Math.random() * 0.04 - 0.02) * 100000000)

      console.log('Manual prices:')
      console.log('  Gold:', (goldPrice / 100000000).toFixed(2), 'USD/oz')
      console.log('  Silver:', (silverPrice / 100000000).toFixed(2), 'USD/oz')
      console.log('  EUR/USD:', (eurUsdRate / 100000000).toFixed(4))

      const tx = await program.methods
        .updatePrices(goldPrice, silverPrice, eurUsdRate)
        .accounts({
          oracleData: oraclePDA,
          authority: wallet.publicKey,
        })
        .rpc()

      console.log('✅ Prices updated manually!')
      console.log('📝 Transaction:', tx, '\n')
    } catch (error: any) {
      console.error('❌ Manual update failed:', error.message)
    }
  }

  // Initial update
  await update()

  // Watch mode - update every 30 seconds
  if (watch) {
    console.log('👀 Watch mode enabled - updating every 30 seconds')
    console.log('   Press Ctrl+C to stop\n')

    setInterval(async () => {
      console.log(`[${new Date().toLocaleTimeString()}] Updating prices...`)
      await update()
    }, 30000)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const watchMode = args.includes('--watch') || args.includes('-w')

updatePrices(watchMode)
  .then(() => {
    if (!watchMode) {
      process.exit(0)
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
