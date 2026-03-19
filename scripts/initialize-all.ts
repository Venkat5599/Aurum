import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { 
  Connection, 
  Keypair, 
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

// Load IDLs
const vaultIdl = JSON.parse(fs.readFileSync("target/idl/vault.json", "utf-8"));
const complianceIdl = JSON.parse(fs.readFileSync("target/idl/compliance.json", "utf-8"));
const oracleIdl = JSON.parse(fs.readFileSync("target/idl/oracle.json", "utf-8"));
const yieldOptimizerIdl = JSON.parse(fs.readFileSync("target/idl/yield_optimizer.json", "utf-8"));

const VAULT_PROGRAM_ID = new PublicKey("CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn");
const COMPLIANCE_PROGRAM_ID = new PublicKey("zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz");
const ORACLE_PROGRAM_ID = new PublicKey("FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp");
const YIELD_OPTIMIZER_PROGRAM_ID = new PublicKey("4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS");

async function main() {
  console.log("🚀 Aurum Initialization Script\n");

  // Setup connection and wallet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const walletPath = process.env.ANCHOR_WALLET || `${process.env.HOME}/.config/solana/id.json`;
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  
  const wallet = new Wallet(walletKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  console.log(`📡 Network: Devnet`);
  console.log(`👛 Wallet: ${wallet.publicKey.toString()}`);
  
  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL\n`);

  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.error("❌ Insufficient balance. Need at least 0.5 SOL");
    console.log("Run: solana airdrop 2");
    process.exit(1);
  }

  // ============================================
  // STEP 1: Create Token Mints
  // ============================================
  console.log("📦 Step 1: Creating Token Mints...\n");

  // Create auUSD mint
  console.log("Creating auUSD mint...");
  const auusdMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey, // mint authority
    null, // freeze authority
    6 // decimals
  );
  console.log(`✅ auUSD Mint: ${auusdMint.toString()}`);

  // Create Gold token mint (for testing)
  console.log("Creating Gold token mint...");
  const goldMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    null,
    6
  );
  console.log(`✅ Gold Mint: ${goldMint.toString()}`);

  // Create Silver token mint (for testing)
  console.log("Creating Silver token mint...");
  const silverMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    null,
    6
  );
  console.log(`✅ Silver Mint: ${silverMint.toString()}\n`);

  // ============================================
  // STEP 2: Initialize Oracle
  // ============================================
  console.log("📦 Step 2: Initializing Oracle...\n");

  const oracleProgram = new Program(oracleIdl as any, provider);
  
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("oracle"), wallet.publicKey.toBuffer()],
    ORACLE_PROGRAM_ID
  );

  try {
    const oracleAccount = await connection.getAccountInfo(oraclePDA);
    if (oracleAccount) {
      console.log("⚠️  Oracle already initialized");
    } else {
      const tx = await oracleProgram.methods
        .initialize()
        .accounts({
          oracle: oraclePDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`✅ Oracle initialized: ${tx}`);
    }
  } catch (error: any) {
    console.log(`⚠️  Oracle initialization: ${error.message}`);
  }

  // Update oracle prices
  console.log("Updating oracle prices...");
  try {
    const goldPrice = new anchor.BN(2650 * 100_000_000); // $2,650 with 8 decimals
    const silverPrice = new anchor.BN(31 * 100_000_000); // $31 with 8 decimals
    
    const tx = await oracleProgram.methods
      .updatePrice("GOLD", goldPrice)
      .accounts({
        oracle: oraclePDA,
        authority: wallet.publicKey,
      })
      .rpc();
    
    console.log(`✅ Gold price updated: ${tx}`);

    const tx2 = await oracleProgram.methods
      .updatePrice("SILVER", silverPrice)
      .accounts({
        oracle: oraclePDA,
        authority: wallet.publicKey,
      })
      .rpc();
    
    console.log(`✅ Silver price updated: ${tx2}\n`);
  } catch (error: any) {
    console.log(`⚠️  Price update: ${error.message}\n`);
  }

  // ============================================
  // STEP 3: Initialize Compliance
  // ============================================
  console.log("📦 Step 3: Initializing Compliance...\n");

  const complianceProgram = new Program(complianceIdl as any, provider);
  
  const [complianceConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    COMPLIANCE_PROGRAM_ID
  );

  try {
    const configAccount = await connection.getAccountInfo(complianceConfigPDA);
    if (configAccount) {
      console.log("⚠️  Compliance already initialized");
    } else {
      const tx = await complianceProgram.methods
        .initialize()
        .accounts({
          config: complianceConfigPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`✅ Compliance initialized: ${tx}`);
    }
  } catch (error: any) {
    console.log(`⚠️  Compliance initialization: ${error.message}`);
  }

  // Verify KYC for the wallet (for testing)
  console.log("Verifying KYC for wallet...");
  try {
    const [userStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_state"), wallet.publicKey.toBuffer()],
      COMPLIANCE_PROGRAM_ID
    );

    const zkProof = Buffer.alloc(32); // Mock ZK proof for demo
    
    const tx = await complianceProgram.methods
      .verifyKyc(zkProof)
      .accounts({
        userState: userStatePDA,
        user: wallet.publicKey,
        config: complianceConfigPDA,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log(`✅ KYC verified: ${tx}\n`);
  } catch (error: any) {
    console.log(`⚠️  KYC verification: ${error.message}\n`);
  }

  // ============================================
  // STEP 4: Initialize Vault
  // ============================================
  console.log("📦 Step 4: Initializing Vault...\n");

  const vaultProgram = new Program(vaultIdl as any, provider);
  
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), wallet.publicKey.toBuffer()],
    VAULT_PROGRAM_ID
  );

  try {
    const vaultAccount = await connection.getAccountInfo(vaultPDA);
    if (vaultAccount) {
      console.log("⚠️  Vault already initialized");
    } else {
      const overCollateralRatio = 110; // 110%
      
      const tx = await vaultProgram.methods
        .initialize(overCollateralRatio)
        .accounts({
          vault: vaultPDA,
          authority: wallet.publicKey,
          auusdMint: auusdMint,
          oracle: oraclePDA,
          compliance: complianceConfigPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`✅ Vault initialized: ${tx}`);
    }
  } catch (error: any) {
    console.log(`⚠️  Vault initialization: ${error.message}`);
  }

  console.log();

  // ============================================
  // STEP 5: Initialize Yield Optimizer
  // ============================================
  console.log("📦 Step 5: Initializing Yield Optimizer...\n");

  const yieldProgram = new Program(yieldOptimizerIdl as any, provider);
  
  const [yieldConfigPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    YIELD_OPTIMIZER_PROGRAM_ID
  );

  try {
    const configAccount = await connection.getAccountInfo(yieldConfigPDA);
    if (configAccount) {
      console.log("⚠️  Yield Optimizer already initialized");
    } else {
      const tx = await yieldProgram.methods
        .initialize()
        .accounts({
          config: yieldConfigPDA,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log(`✅ Yield Optimizer initialized: ${tx}`);
    }
  } catch (error: any) {
    console.log(`⚠️  Yield Optimizer initialization: ${error.message}`);
  }

  console.log();

  // ============================================
  // STEP 6: Mint Test Tokens
  // ============================================
  console.log("📦 Step 6: Minting Test Tokens...\n");

  // Mint Gold tokens to wallet
  const goldTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    goldMint,
    wallet.publicKey
  );

  await mintTo(
    connection,
    walletKeypair,
    goldMint,
    goldTokenAccount.address,
    wallet.publicKey,
    100_000_000_000 // 100,000 GOLD tokens
  );
  console.log(`✅ Minted 100,000 GOLD tokens to ${wallet.publicKey.toString()}`);

  // Mint Silver tokens to wallet
  const silverTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    silverMint,
    wallet.publicKey
  );

  await mintTo(
    connection,
    walletKeypair,
    silverMint,
    silverTokenAccount.address,
    wallet.publicKey,
    1_000_000_000_000 // 1,000,000 SILVER tokens
  );
  console.log(`✅ Minted 1,000,000 SILVER tokens to ${wallet.publicKey.toString()}\n`);

  // ============================================
  // STEP 7: Update Environment Files
  // ============================================
  console.log("📦 Step 7: Updating Environment Files...\n");

  const envContent = `# Solana RPC
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Program IDs
NEXT_PUBLIC_VAULT_PROGRAM_ID=${VAULT_PROGRAM_ID.toString()}
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=${COMPLIANCE_PROGRAM_ID.toString()}
NEXT_PUBLIC_ORACLE_PROGRAM_ID=${ORACLE_PROGRAM_ID.toString()}
NEXT_PUBLIC_YIELD_PROGRAM_ID=${YIELD_OPTIMIZER_PROGRAM_ID.toString()}
NEXT_PUBLIC_AUUSD_MINT=${auusdMint.toString()}

# Test Token Mints
NEXT_PUBLIC_GOLD_MINT=${goldMint.toString()}
NEXT_PUBLIC_SILVER_MINT=${silverMint.toString()}

# Vault Authority
NEXT_PUBLIC_VAULT_AUTHORITY=${wallet.publicKey.toString()}

# SIX Oracle API (mock for hackathon)
SIX_API_KEY=your_api_key_here
SIX_API_URL=https://api.six-group.com/v1/metals
`;

  fs.writeFileSync(".env.example", envContent);
  fs.writeFileSync("frontend/.env.local", envContent);
  
  console.log("✅ Updated .env.example");
  console.log("✅ Updated frontend/.env.local\n");

  // ============================================
  // Summary
  // ============================================
  console.log("🎉 Initialization Complete!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`auUSD Mint:        ${auusdMint.toString()}`);
  console.log(`Gold Mint:         ${goldMint.toString()}`);
  console.log(`Silver Mint:       ${silverMint.toString()}`);
  console.log(`Vault PDA:         ${vaultPDA.toString()}`);
  console.log(`Oracle PDA:        ${oraclePDA.toString()}`);
  console.log(`Compliance Config: ${complianceConfigPDA.toString()}`);
  console.log(`Yield Config:      ${yieldConfigPDA.toString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log("✅ All programs initialized");
  console.log("✅ Test tokens minted");
  console.log("✅ Environment files updated");
  console.log("\n🚀 Next steps:");
  console.log("1. cd frontend && npm install");
  console.log("2. npm run dev");
  console.log("3. Open http://localhost:3000");
  console.log("4. Connect your wallet and start testing!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
