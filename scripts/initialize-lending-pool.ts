/**
 * Initialize Lending Pool
 * Sets up the lending pool for yield generation
 */

import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

const lendingPoolIdl = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../target/idl/lending_pool.json'), 'utf-8')
)
const LENDING_POOL_PROGRAM_ID = new PublicKey('LendP001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')

async function initializeLendingPool() {
  console.log('🏦 Initializing Lending Pool')
  console.log('============================\n')

  // Setup connection and wallet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  const walletPath = process.env.HOME + '/.config/solana/id.json'
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  )
  const wallet = new Wallet(walletKeypair)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  const program = new Program(lendingPoolIdl, LENDING_POOL_PROGRAM_ID, provider)

  console.log('Authority:', wallet.publicKey.toString())

  // Load auUSD mint from config
  const configPath = path.join(__dirname, '../.aurum-config.json')
  let auUsdMint: PublicKey

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    auUsdMint = new PublicKey(config.auUsdMint)
    console.log('Using auUSD mint:', auUsdMint.toString())
  } else {
    console.error('❌ Config file not found. Run initialize-programs.ts first.')
    process.exit(1)
  }

  // Derive pool PDA
  const [poolPDA, poolBump] = PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), wallet.publicKey.toBuffer()],
    LENDING_POOL_PROGRAM_ID
  )

  console.log('Pool PDA:', poolPDA.toString())

  // Create pool vault token account
  console.log('\n📦 Creating pool vault...')
  const poolVault = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    auUsdMint,
    poolPDA,
    true // allowOwnerOffCurve - PDA can own token accounts
  )

  console.log('Pool vault:', poolVault.address.toString())

  // Initialize pool with 8% base APY
  const baseApy = 800 // 8.00% in basis points

  console.log('\n🚀 Initializing lending pool...')
  console.log('Base APY:', baseApy / 100, '%')

  try {
    const tx = await program.methods
      .initialize(baseApy)
      .accounts({
        pool: poolPDA,
        authority: wallet.publicKey,
        tokenMint: auUsdMint,
        poolVault: poolVault.address,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    console.log('✅ Lending pool initialized!')
    console.log('📝 Transaction:', tx)
    console.log(`🌐 https://explorer.solana.com/tx/${tx}?cluster=devnet`)

    // Save pool info to config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    config.lendingPool = {
      poolAddress: poolPDA.toString(),
      poolVault: poolVault.address.toString(),
      tokenMint: auUsdMint.toString(),
      baseApy: baseApy,
      authority: wallet.publicKey.toString(),
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('\n💾 Pool info saved to .aurum-config.json')

    // Fetch and display pool state
    console.log('\n📊 Pool State:')
    const poolAccount = await program.account.pool.fetch(poolPDA)
    console.log('  Total Deposits:', poolAccount.totalDeposits.toString())
    console.log('  Total Borrowed:', poolAccount.totalBorrowed.toString())
    console.log('  Base APY:', poolAccount.baseApy / 100, '%')
    console.log('  Current APY:', poolAccount.currentApy / 100, '%')
    console.log('  Utilization Rate:', poolAccount.utilizationRate / 100, '%')
  } catch (error: any) {
    if (error.message?.includes('already in use')) {
      console.log('ℹ️  Pool already initialized')

      // Fetch and display existing pool state
      const poolAccount = await program.account.pool.fetch(poolPDA)
      console.log('\n📊 Existing Pool State:')
      console.log('  Total Deposits:', poolAccount.totalDeposits.toString())
      console.log('  Total Borrowed:', poolAccount.totalBorrowed.toString())
      console.log('  Base APY:', poolAccount.baseApy / 100, '%')
      console.log('  Current APY:', poolAccount.currentApy / 100, '%')
      console.log('  Utilization Rate:', poolAccount.utilizationRate / 100, '%')
    } else {
      console.error('❌ Error:', error)
      throw error
    }
  }

  console.log('\n✨ Lending pool setup complete!')
}

initializeLendingPool()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
