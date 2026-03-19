const { Connection, PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Program IDs
const VAULT_PROGRAM_ID = new PublicKey('CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn');
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp');
const COMPLIANCE_PROGRAM_ID = new PublicKey('zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz');
const AUUSD_MINT = new PublicKey('AbPkhvGT7TrTZbNNQQeeNMJ7wFCfcWAuZyeV2xYYYaaS');

// Load wallet
function loadWallet() {
  const walletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const secretKey = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const wallet = loadWallet();
  
  console.log('Authority:', wallet.publicKey.toString());
  
  // Derive PDAs
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), wallet.publicKey.toBuffer()],
    VAULT_PROGRAM_ID
  );
  
  const [userStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_state'), wallet.publicKey.toBuffer()],
    VAULT_PROGRAM_ID
  );
  
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), wallet.publicKey.toBuffer()],
    ORACLE_PROGRAM_ID
  );
  
  console.log('\n📍 PDAs:');
  console.log('Vault PDA:', vaultPDA.toString());
  console.log('User State PDA:', userStatePDA.toString());
  console.log('Oracle PDA:', oraclePDA.toString());
  
  // Check if vault exists
  const vaultInfo = await connection.getAccountInfo(vaultPDA);
  if (!vaultInfo) {
    console.log('\n🔨 Initializing vault...');
    
    // Initialize instruction discriminator for "initialize"
    const initDiscriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
    const overCollateralRatio = Buffer.alloc(2);
    overCollateralRatio.writeUInt16LE(110); // 110%
    
    const initData = Buffer.concat([initDiscriminator, overCollateralRatio]);
    
    const initIx = new TransactionInstruction({
      keys: [
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: AUUSD_MINT, isSigner: false, isWritable: false },
        { pubkey: oraclePDA, isSigner: false, isWritable: false },
        { pubkey: COMPLIANCE_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: VAULT_PROGRAM_ID,
      data: initData,
    });
    
    const tx = new Transaction().add(initIx);
    const sig = await connection.sendTransaction(tx, [wallet]);
    await connection.confirmTransaction(sig);
    
    console.log('✅ Vault initialized!');
    console.log('Transaction:', sig);
  } else {
    console.log('\n✅ Vault already initialized');
  }
  
  // Check if user state exists
  const userStateInfo = await connection.getAccountInfo(userStatePDA);
  if (!userStateInfo) {
    console.log('\n🔨 Initializing user state...');
    
    // InitializeUser instruction discriminator
    const initUserDiscriminator = Buffer.from([111, 17, 185, 250, 60, 122, 38, 254]);
    
    const initUserIx = new TransactionInstruction({
      keys: [
        { pubkey: userStatePDA, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: VAULT_PROGRAM_ID,
      data: initUserDiscriminator,
    });
    
    const tx = new Transaction().add(initUserIx);
    const sig = await connection.sendTransaction(tx, [wallet]);
    await connection.confirmTransaction(sig);
    
    console.log('✅ User state initialized!');
    console.log('Transaction:', sig);
  } else {
    console.log('\n✅ User state already initialized');
  }
  
  console.log('\n✅ All initialization complete!');
  console.log('\n📋 Summary:');
  console.log('Vault PDA:', vaultPDA.toString());
  console.log('User State PDA:', userStatePDA.toString());
  console.log('auUSD Mint:', AUUSD_MINT.toString());
  console.log('\n🎉 You can now mint auUSD from the frontend!');
}

main().catch(console.error);
