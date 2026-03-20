const { Connection, PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Program IDs
const VAULT_PROGRAM_ID = new PublicKey('CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn');
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp');
const COMPLIANCE_PROGRAM_ID = new PublicKey('zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz');
const AUUSD_MINT = new PublicKey('AbPkhvGT7TrTZbNNQQeeNMJ7wFCfcWAuZyeV2xYYYaaS');
const GOLD_MINT = new PublicKey('3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK');
const SILVER_MINT = new PublicKey('4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2');

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
  
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), wallet.publicKey.toBuffer()],
    ORACLE_PROGRAM_ID
  );
  
  console.log('\n📍 PDAs:');
  console.log('Vault PDA:', vaultPDA.toString());
  console.log('Oracle PDA:', oraclePDA.toString());
  
  // Check if vault exists
  const vaultInfo = await connection.getAccountInfo(vaultPDA);
  if (!vaultInfo) {
    console.log('\n🔨 Initializing vault...');
    
    const initDiscriminator = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]);
    const overCollateralRatio = Buffer.alloc(2);
    overCollateralRatio.writeUInt16LE(110);
    
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
  
  // Create vault token accounts for gold and silver
  console.log('\n🔨 Setting up vault token accounts...');
  
  const vaultGoldAta = await getAssociatedTokenAddress(GOLD_MINT, vaultPDA, true);
  const vaultSilverAta = await getAssociatedTokenAddress(SILVER_MINT, vaultPDA, true);
  
  const instructions = [];
  
  // Check and create gold ATA
  try {
    await connection.getAccountInfo(vaultGoldAta);
    console.log('✅ Vault gold token account exists');
  } catch {
    console.log('Creating vault gold token account...');
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        vaultGoldAta,
        vaultPDA,
        GOLD_MINT
      )
    );
  }
  
  // Check and create silver ATA
  try {
    await connection.getAccountInfo(vaultSilverAta);
    console.log('✅ Vault silver token account exists');
  } catch {
    console.log('Creating vault silver token account...');
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        vaultSilverAta,
        vaultPDA,
        SILVER_MINT
      )
    );
  }
  
  if (instructions.length > 0) {
    const tx = new Transaction().add(...instructions);
    const sig = await connection.sendTransaction(tx, [wallet]);
    await connection.confirmTransaction(sig);
    console.log('✅ Vault token accounts created!');
    console.log('Transaction:', sig);
  }
  
  console.log('\n✅ Vault setup complete!');
  console.log('\n📋 Summary:');
  console.log('Vault PDA:', vaultPDA.toString());
  console.log('Vault Gold ATA:', vaultGoldAta.toString());
  console.log('Vault Silver ATA:', vaultSilverAta.toString());
  console.log('\n🎉 You can now mint auUSD from the frontend!');
}

main().catch(console.error);
