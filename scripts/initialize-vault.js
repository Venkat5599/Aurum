const anchor = require('@coral-xyz/anchor');
const { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
require('dotenv').config();

// Program IDs
const VAULT_PROGRAM_ID = new PublicKey('CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn');
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp');
const COMPLIANCE_PROGRAM_ID = new PublicKey('zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz');
const AUUSD_MINT = new PublicKey('AbPkhvGT7TrTZbNNQQeeNMJ7wFCfcWAuZyeV2xYYYaaS');

async function main() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const connection = provider.connection;
  const idl = require('../target/idl/vault.json');
  const program = new anchor.Program(idl, VAULT_PROGRAM_ID, provider);
  
  const authority = provider.wallet.publicKey;
  console.log('Authority:', authority.toString());
  
  // Derive PDAs
  const [vaultPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), authority.toBuffer()],
    VAULT_PROGRAM_ID
  );
  
  const [userStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_state'), authority.toBuffer()],
    VAULT_PROGRAM_ID
  );
  
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), authority.toBuffer()],
    ORACLE_PROGRAM_ID
  );
  
  console.log('\n📍 PDAs:');
  console.log('Vault PDA:', vaultPDA.toString());
  console.log('User State PDA:', userStatePDA.toString());
  console.log('Oracle PDA:', oraclePDA.toString());
  
  try {
    // Check if vault is already initialized
    try {
      const vaultAccountInfo = await connection.getAccountInfo(vaultPDA);
      if (vaultAccountInfo) {
        console.log('\n✅ Vault already initialized');
      } else {
        throw new Error('Not initialized');
      }
    } catch (e) {
      // Vault not initialized, initialize it
      console.log('\n🔨 Initializing vault...');
      const tx = await program.methods
        .initialize(110) // 110% over-collateralization
        .accounts({
          vault: vaultPDA,
          authority: authority,
          auusdMint: AUUSD_MINT,
          oracle: oraclePDA,
          compliance: COMPLIANCE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ Vault initialized!');
      console.log('Transaction:', tx);
    }
    
    // Check if user state is already initialized
    try {
      const userStateAccountInfo = await connection.getAccountInfo(userStatePDA);
      if (userStateAccountInfo) {
        console.log('\n✅ User state already initialized');
      } else {
        throw new Error('Not initialized');
      }
    } catch (e) {
      // User state not initialized, initialize it
      console.log('\n🔨 Initializing user state...');
      const tx = await program.methods
        .initializeUser()
        .accounts({
          userState: userStatePDA,
          user: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('✅ User state initialized!');
      console.log('Transaction:', tx);
    }
    
    console.log('\n✅ All initialization complete!');
    console.log('\n📋 Summary:');
    console.log('Vault PDA:', vaultPDA.toString());
    console.log('User State PDA:', userStatePDA.toString());
    console.log('auUSD Mint:', AUUSD_MINT.toString());
    console.log('\n🎉 You can now mint auUSD!');
    
  } catch (error) {
    console.error('Error:', error);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
  }
}

main();
