const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const os = require('os');
const path = require('path');

const GOLD_MINT = new PublicKey('3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK');
const SILVER_MINT = new PublicKey('4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2');
const AUUSD_MINT = new PublicKey('AbPkhvGT7TrTZbNNQQeeNMJ7wFCfcWAuZyeV2xYYYaaS');

async function main() {
  console.log('Checking Token Accounts\n');
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  const walletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const walletKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );
  
  console.log('Wallet:', walletKeypair.publicKey.toString(), '\n');
  
  // Check all token accounts for this wallet
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletKeypair.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID }
  );
  
  console.log('Token-2022 Accounts:', tokenAccounts.value.length);
  
  if (tokenAccounts.value.length > 0) {
    console.log('\nYour Token Balances:');
    for (const account of tokenAccounts.value) {
      const data = account.account.data.parsed.info;
      console.log(`  Mint: ${data.mint}`);
      console.log(`  Balance: ${data.tokenAmount.uiAmount}`);
      console.log(`  Account: ${account.pubkey.toString()}\n`);
    }
  } else {
    console.log('No Token-2022 accounts found.\n');
  }
  
  // Also check regular token program
  const regularTokenAccounts = await connection.getParsedTokenAccountsByOwner(
    walletKeypair.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  
  console.log('Regular Token Accounts:', regularTokenAccounts.value.length);
  
  if (regularTokenAccounts.value.length > 0) {
    console.log('\nRegular Token Balances:');
    for (const account of regularTokenAccounts.value) {
      const data = account.account.data.parsed.info;
      console.log(`  Mint: ${data.mint}`);
      console.log(`  Balance: ${data.tokenAmount.uiAmount}`);
      console.log(`  Account: ${account.pubkey.toString()}\n`);
    }
  }
  
  // Check expected addresses
  console.log('\nExpected Token Accounts:');
  
  const goldATA = await getAssociatedTokenAddress(
    GOLD_MINT,
    walletKeypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log('Gold ATA:', goldATA.toString());
  
  const silverATA = await getAssociatedTokenAddress(
    SILVER_MINT,
    walletKeypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log('Silver ATA:', silverATA.toString());
  
  const auusdATA = await getAssociatedTokenAddress(
    AUUSD_MINT,
    walletKeypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log('auUSD ATA:', auusdATA.toString(), '\n');
  
  // Check if they exist
  const goldAccount = await connection.getAccountInfo(goldATA);
  const silverAccount = await connection.getAccountInfo(silverATA);
  const auusdAccount = await connection.getAccountInfo(auusdATA);
  
  console.log('Account Status:');
  console.log('  Gold:', goldAccount ? 'EXISTS' : 'NOT FOUND');
  console.log('  Silver:', silverAccount ? 'EXISTS' : 'NOT FOUND');
  console.log('  auUSD:', auusdAccount ? 'EXISTS' : 'NOT FOUND');
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
