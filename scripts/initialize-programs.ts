/**
 * Initialize all Aurum programs on Solana devnet
 * Run this script once to set up the on-chain state
 *
 * Usage: ts-node scripts/initialize-programs.ts
 */

import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor'
import { createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'

// Load IDLs
const vaultIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/vault.json'), 'utf-8'))
const complianceIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/compliance.json'), 'utf-8'))
const oracleIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/oracle.json'), 'utf-8'))
const yieldOptimizerIdl = JSON.parse(fs.readFileSync(path.join(__dirname, '../target/idl/yield_optimizer.json'), 'utf-8'))

// Program IDs from Anchor.toml
const PROGRAM_IDS = {
  vault: new PublicKey('CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn'),
  compliance: new PublicKey('zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz'),
  oracle: new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp'),
  yieldOptimizer: new PublicKey('4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS'),
}

async function main() {
  console.log('🚀 Initializing Aurum programs on Solana devnet...\n')

  // 1. Setup connection and wallet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed')
  const walletPath = process.env.HOME + '/.config/solana/id.json'
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  )
  const wallet = new Wallet(walletKeypair)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })

  console.log('📍 Authority:', wallet.publicKey.toString())
  console.log('💰 Balance:', await connection.getBalance(wallet.publicKey) / 1e9, 'SOL\n')

  // 2. Create auUSD mint
  console.log('🪙 Creating auUSD mint...')
  const auusdMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey, // mint authority
    null, // freeze authority
    6 // decimals (USD has 6 decimals)
  )
  console.log('✅ auUSD Mint:', auusdMint.toString(), '\n')

  // 3. Initialize Oracle
  console.log('🔮 Initializing Oracle...')
  const oracleProgram = new Program(oracleIdl, PROGRAM_IDS.oracle, provider)
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), wallet.publicKey.toBuffer()],
    PROGRAM_IDS.oracle
  )

  try {
    await oracleProgram.account.oracleData.fetch(oraclePDA)
    console.log('⚠️  Oracle already initialized')
  } catch {
    const tx = await oracleProgram.methods
      .initialize()
      .accounts({
        oracleData: oraclePDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
    console.log('✅ Oracle initialized:', tx)

    // Update with initial prices
    console.log('📊 Setting initial prices...')
    const goldPrice = new BN(265000000000) // $2650.00 with 8 decimals
    const silverPrice = new BN(3150000000) // $31.50 with 8 decimals
    const eurUsdRate = new BN(108000000) // 1.08 with 8 decimals

    const updateTx = await oracleProgram.methods
      .updatePrices(goldPrice, silverPrice, eurUsdRate)
      .accounts({
        oracleData: oraclePDA,
        authority: wallet.publicKey,
      })
      .rpc()
    console.log('✅ Prices updated:', updateTx)
  }
  console.log('🔮 Oracle PDA:', oraclePDA.toString(), '\n')

  // 4. Initialize Vault
  console.log('🏦 Initializing Vault...')
  const vaultProgram = new Program(vaultIdl, PROGRAM_IDS.vault, provider)
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), wallet.publicKey.toBuffer()],
    PROGRAM_IDS.vault
  )

  try {
    await vaultProgram.account.vault.fetch(vaultPDA)
    console.log('⚠️  Vault already initialized')
  } catch {
    const overCollateralRatio = 110 // 110%
    const tx = await vaultProgram.methods
      .initialize(overCollateralRatio)
      .accounts({
        vault: vaultPDA,
        authority: wallet.publicKey,
        auusdMint: auusdMint,
        oracle: oraclePDA,
        compliance: PROGRAM_IDS.compliance,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
    console.log('✅ Vault initialized:', tx)
  }
  console.log('🏦 Vault PDA:', vaultPDA.toString(), '\n')

  // 5. Save configuration to .env
  console.log('💾 Saving configuration...')
  const envContent = `# Solana RPC
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Program IDs
NEXT_PUBLIC_VAULT_PROGRAM_ID=${PROGRAM_IDS.vault.toString()}
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=${PROGRAM_IDS.compliance.toString()}
NEXT_PUBLIC_ORACLE_PROGRAM_ID=${PROGRAM_IDS.oracle.toString()}
NEXT_PUBLIC_YIELD_PROGRAM_ID=${PROGRAM_IDS.yieldOptimizer.toString()}

# Token Mints
NEXT_PUBLIC_AUUSD_MINT=${auusdMint.toString()}

# Authorities (for PDA derivation)
NEXT_PUBLIC_VAULT_AUTHORITY=${wallet.publicKey.toString()}
NEXT_PUBLIC_ORACLE_AUTHORITY=${wallet.publicKey.toString()}
`

  fs.writeFileSync(path.join(__dirname, '../frontend/.env.local'), envContent)
  console.log('✅ Configuration saved to frontend/.env.local\n')

  // 6. Summary
  console.log('🎉 Initialization complete!\n')
  console.log('📋 Summary:')
  console.log('  - auUSD Mint:', auusdMint.toString())
  console.log('  - Vault PDA:', vaultPDA.toString())
  console.log('  - Oracle PDA:', oraclePDA.toString())
  console.log('  - Authority:', wallet.publicKey.toString())
  console.log('\n🌐 View on Explorer:')
  console.log(`  https://explorer.solana.com/address/${vaultPDA.toString()}?cluster=devnet`)
  console.log('\n✨ Next steps:')
  console.log('  1. cd frontend && npm run dev')
  console.log('  2. Connect your wallet')
  console.log('  3. Start minting auUSD!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
