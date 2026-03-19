const anchor = require("@coral-xyz/anchor");
const { AnchorProvider, Wallet } = require("@coral-xyz/anchor");
const { 
  Connection, 
  Keypair, 
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL
} = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

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
  
  // Windows-compatible wallet path
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const walletPath = process.env.ANCHOR_WALLET || `${homeDir}/.config/solana/id.json`;
  
  if (!fs.existsSync(walletPath)) {
    console.error(`❌ Wallet not found at: ${walletPath}`);
    console.log("\nTry setting ANCHOR_WALLET environment variable:");
    console.log("  set ANCHOR_WALLET=C:\\path\\to\\your\\wallet.json");
    process.exit(1);
  }
  
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
    wallet.publicKey,
    null,
    6
  );
  console.log(`✅ auUSD Mint: ${auusdMint.toString()}`);

  // Create Gold token mint
  console.log("Creating Gold token mint...");
  const goldMint = await createMint(
    connection,
    walletKeypair,
    wallet.publicKey,
    null,
    6
  );
  console.log(`✅ Gold Mint: ${goldMint.toString()}`);

  // Create Silver token mint
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
  // STEP 2: Mint Test Tokens
  // ============================================
  console.log("📦 Step 2: Minting Test Tokens...\n");

  // Mint Gold tokens
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
    100_000_000_000 // 100,000 GOLD
  );
  console.log(`✅ Minted 100,000 GOLD tokens`);

  // Mint Silver tokens
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
    1_000_000_000_000 // 1,000,000 SILVER
  );
  console.log(`✅ Minted 1,000,000 SILVER tokens\n`);

  // ============================================
  // STEP 3: Update Environment Files
  // ============================================
  console.log("📦 Step 3: Updating Environment Files...\n");

  const envContent = `# Solana RPC
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Program IDs
NEXT_PUBLIC_VAULT_PROGRAM_ID=${VAULT_PROGRAM_ID.toString()}
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=${COMPLIANCE_PROGRAM_ID.toString()}
NEXT_PUBLIC_ORACLE_PROGRAM_ID=${ORACLE_PROGRAM_ID.toString()}
NEXT_PUBLIC_YIELD_PROGRAM_ID=${YIELD_OPTIMIZER_PROGRAM_ID.toString()}
NEXT_PUBLIC_LENDING_POOL_PROGRAM_ID=D9StNM3VEdCopzf9nTuBqFZKDh8kSNPA4tTC68UneHJs
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
  console.log("🎉 Token Setup Complete!\n");
  console.log("📋 Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`auUSD Mint:   ${auusdMint.toString()}`);
  console.log(`Gold Mint:    ${goldMint.toString()}`);
  console.log(`Silver Mint:  ${silverMint.toString()}`);
  console.log(`Your Wallet:  ${wallet.publicKey.toString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log("✅ Token mints created");
  console.log("✅ Test tokens minted to your wallet");
  console.log("✅ Environment files updated");
  console.log("\n🚀 Next steps:");
  console.log("1. cd frontend");
  console.log("2. npm install");
  console.log("3. npm run dev");
  console.log("4. Open http://localhost:3000");
  console.log("5. Connect your wallet and start testing!\n");
  
  console.log("⚠️  Note: Programs are deployed but not initialized.");
  console.log("   The frontend will work with mock data until programs are initialized.");
  console.log("   For a hackathon demo, this is perfectly fine!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
