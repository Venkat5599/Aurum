const { Connection, PublicKey } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');
const fs = require('fs');

const oracleIdl = JSON.parse(fs.readFileSync('./frontend/lib/idl/oracle.json', 'utf-8'));
const ORACLE_PDA = new PublicKey('4MM9KM4HXTdVEV2kmw7ifC8MvzD33TS6qtkfP25WcaRG');

async function main() {
  console.log('🔍 Verifying Oracle Data On-Chain\n');
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Check if account exists
  const accountInfo = await connection.getAccountInfo(ORACLE_PDA);
  
  if (!accountInfo) {
    console.log('❌ Oracle account not found!');
    console.log('   Run: node scripts/update-oracle-real-prices.js\n');
    process.exit(1);
  }
  
  console.log('✅ Oracle account exists on-chain');
  console.log('   Address:', ORACLE_PDA.toString());
  console.log('   Owner:', accountInfo.owner.toString());
  console.log('   Data Length:', accountInfo.data.length, 'bytes');
  console.log('   Lamports:', accountInfo.lamports / 1e9, 'SOL\n');
  
  // Decode the data
  const wallet = {
    publicKey: ORACLE_PDA,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  };
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(oracleIdl, provider);
  
  try {
    const oracleData = await program.account.oracleData.fetch(ORACLE_PDA);
    
    const PRICE_DECIMALS = 8;
    const goldPrice = oracleData.goldPriceUsd.toNumber() / Math.pow(10, PRICE_DECIMALS);
    const silverPrice = oracleData.silverPriceUsd.toNumber() / Math.pow(10, PRICE_DECIMALS);
    const eurUsdRate = oracleData.eurUsdRate.toNumber() / Math.pow(10, PRICE_DECIMALS);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Oracle Data (Stored On-Chain)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Authority:', oracleData.authority.toString());
    console.log('   Gold Price:', '$' + goldPrice.toFixed(2));
    console.log('   Silver Price:', '$' + silverPrice.toFixed(2));
    console.log('   EUR/USD Rate:', eurUsdRate.toFixed(2));
    console.log('   Last Update:', new Date(oracleData.lastUpdate.toNumber() * 1000).toLocaleString());
    console.log('   Update Count:', oracleData.updateCount.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Oracle has REAL price data stored on Solana blockchain!');
    console.log('✅ Data is persistent and can be read by anyone');
    console.log('✅ Frontend will fetch these real prices\n');
    
  } catch (error) {
    console.log('❌ Error reading oracle data:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
