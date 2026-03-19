/**
 * Comprehensive test suite for Aurum programs
 * Tests all core functionality: vault, compliance, oracle, yield optimizer
 */

import * as anchor from '@coral-xyz/anchor'
import { Program, BN } from '@coral-xyz/anchor'
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { assert } from 'chai'

describe('Aurum Integration Tests', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  // Load programs
  const vaultProgram = anchor.workspace.Vault as Program
  const complianceProgram = anchor.workspace.Compliance as Program
  const oracleProgram = anchor.workspace.Oracle as Program
  const yieldOptimizerProgram = anchor.workspace.YieldOptimizer as Program

  // Test accounts
  let authority: Keypair
  let user: Keypair
  let auusdMint: PublicKey
  let collateralMint: PublicKey
  let vaultPDA: PublicKey
  let oraclePDA: PublicKey
  let userStatePDA: PublicKey
  let strategyPDA: PublicKey

  before(async () => {
    authority = provider.wallet.payer
    user = Keypair.generate()

    // Airdrop SOL to user
    const airdropSig = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSig)

    // Create mints
    auusdMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    )

    collateralMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      6
    )

    // Derive PDAs
    ;[vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), authority.publicKey.toBuffer()],
      vaultProgram.programId
    )

    ;[oraclePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), authority.publicKey.toBuffer()],
      oracleProgram.programId
    )

    ;[userStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('user_state'), user.publicKey.toBuffer()],
      complianceProgram.programId
    )

    ;[strategyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('strategy'), user.publicKey.toBuffer()],
      yieldOptimizerProgram.programId
    )
  })

  describe('Oracle', () => {
    it('Initializes oracle', async () => {
      await oracleProgram.methods
        .initialize()
        .accounts({
          oracleData: oraclePDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      const oracleData = await oracleProgram.account.oracleData.fetch(oraclePDA)
      assert.equal(oracleData.authority.toString(), authority.publicKey.toString())
      assert.equal(oracleData.updateCount.toNumber(), 0)
    })

    it('Updates prices', async () => {
      const goldPrice = new BN(265000000000) // $2650 with 8 decimals
      const silverPrice = new BN(3150000000) // $31.50 with 8 decimals
      const eurUsdRate = new BN(108000000) // 1.08 with 8 decimals

      await oracleProgram.methods
        .updatePrices(goldPrice, silverPrice, eurUsdRate)
        .accounts({
          oracleData: oraclePDA,
          authority: authority.publicKey,
        })
        .rpc()

      const oracleData = await oracleProgram.account.oracleData.fetch(oraclePDA)
      assert.equal(oracleData.goldPriceUsd.toString(), goldPrice.toString())
      assert.equal(oracleData.silverPriceUsd.toString(), silverPrice.toString())
      assert.equal(oracleData.updateCount.toNumber(), 1)
    })
  })

  describe('Compliance', () => {
    it('Initializes user state', async () => {
      await complianceProgram.methods
        .initializeUser()
        .accounts({
          userState: userStatePDA,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc()

      const userState = await complianceProgram.account.userState.fetch(userStatePDA)
      assert.equal(userState.wallet.toString(), user.publicKey.toString())
      assert.equal(userState.kycVerified, false)
      assert.equal(userState.riskScore, 0)
    })

    it('Verifies KYC', async () => {
      const proofData = Array(64).fill(0)
      const expiry = new BN(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60)

      await complianceProgram.methods
        .verifyKyc(proofData, expiry)
        .accounts({
          userState: userStatePDA,
          user: user.publicKey,
        })
        .signers([user])
        .rpc()

      const userState = await complianceProgram.account.userState.fetch(userStatePDA)
      assert.equal(userState.kycVerified, true)
      assert.ok(userState.kycExpiry.toNumber() > 0)
    })

    it('Performs KYT check', async () => {
      const amount = new BN(5000 * 1_000_000) // $5000
      const recipient = Keypair.generate().publicKey

      await complianceProgram.methods
        .kytCheck(amount, recipient)
        .accounts({
          userState: userStatePDA,
          user: user.publicKey,
        })
        .signers([user])
        .rpc()

      const userState = await complianceProgram.account.userState.fetch(userStatePDA)
      assert.ok(userState.riskScore >= 0)
      assert.equal(userState.txCount24h, 1)
    })
  })

  describe('Vault', () => {
    it('Initializes vault', async () => {
      const overCollateralRatio = 110

      await vaultProgram.methods
        .initialize(overCollateralRatio)
        .accounts({
          vault: vaultPDA,
          authority: authority.publicKey,
          auusdMint: auusdMint,
          oracle: oraclePDA,
          compliance: complianceProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      const vault = await vaultProgram.account.vault.fetch(vaultPDA)
      assert.equal(vault.authority.toString(), authority.publicKey.toString())
      assert.equal(vault.overCollateralRatio, overCollateralRatio)
      assert.equal(vault.totalAuusdMinted.toNumber(), 0)
    })

    it('Mints auUSD', async () => {
      // Setup token accounts
      const userAuusdAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        auusdMint,
        user.publicKey
      )

      const userCollateralAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        collateralMint,
        user.publicKey
      )

      const vaultCollateralAta = await getOrCreateAssociatedTokenAccount(
        provider.connection,
        authority,
        collateralMint,
        vaultPDA,
        true
      )

      // Mint collateral to user
      await mintTo(
        provider.connection,
        authority,
        collateralMint,
        userCollateralAta.address,
        authority,
        10 * 1_000_000 // 10 tokens
      )

      const amount = new BN(1000 * 1_000_000) // 1000 auUSD
      const collateralAmount = new BN(1 * 1_000_000) // 1 collateral token

      await vaultProgram.methods
        .mintAuusd(amount, collateralAmount)
        .accounts({
          vault: vaultPDA,
          user: user.publicKey,
          userState: userStatePDA,
          auusdMint: auusdMint,
          userAuusd: userAuusdAta.address,
          userCollateral: userCollateralAta.address,
          vaultCollateral: vaultCollateralAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user])
        .rpc()

      const vault = await vaultProgram.account.vault.fetch(vaultPDA)
      assert.ok(vault.totalAuusdMinted.toNumber() > 0)
    })
  })

  describe('Yield Optimizer', () => {
    it('Initializes strategy', async () => {
      const riskProfile = { conservative: {} }

      await yieldOptimizerProgram.methods
        .initializeStrategy(riskProfile)
        .accounts({
          strategy: strategyPDA,
          user: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc()

      const strategy = await yieldOptimizerProgram.account.yieldStrategy.fetch(strategyPDA)
      assert.equal(strategy.user.toString(), user.publicKey.toString())
      assert.equal(strategy.targetLendingPct, 80)
      assert.equal(strategy.targetHedgingPct, 20)
    })

    it('Allocates funds', async () => {
      const amount = new BN(1000 * 1_000_000) // $1000

      await yieldOptimizerProgram.methods
        .allocate(amount)
        .accounts({
          strategy: strategyPDA,
          user: user.publicKey,
        })
        .signers([user])
        .rpc()

      const strategy = await yieldOptimizerProgram.account.yieldStrategy.fetch(strategyPDA)
      assert.ok(strategy.totalAllocated.toNumber() > 0)
      assert.ok(strategy.lendingAllocation.toNumber() > 0)
    })

    it('Rebalances strategy', async () => {
      const volatility = 600 // 6% volatility
      const kytRisk = 30

      await yieldOptimizerProgram.methods
        .rebalance(volatility, kytRisk)
        .accounts({
          strategy: strategyPDA,
          oracle: oraclePDA,
          compliance: complianceProgram.programId,
        })
        .rpc()

      const strategy = await yieldOptimizerProgram.account.yieldStrategy.fetch(strategyPDA)
      assert.ok(strategy.lastRebalance.toNumber() > 0)
    })
  })
})
