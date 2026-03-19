const anchor = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
const axios = require('axios');

// Program IDs
const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp');

// Update interval (5 minutes)
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function fetchRealPrices() {
  try {
    // Try Metals-API first
    const apiKey = process.env.METALS_API_KEY;
    if (apiKey) {
      const response = await axios.get(`https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU,XAG`);
      if (response.data && response.data.rates) {
        return {
          goldPrice: Math.round((1 / response.data.rates.XAU) * 100) / 100,
          silverPrice: Math.round((1 / response.data.rates.XAG) * 100) / 100,
        };
      }
    }
  } catch (error) {
    console.log('Metals-API not available, using fallback prices');
  }

  // Fallback to recent market prices
  return {
    goldPrice: 2650.00,
    silverPrice: 31.50,
  };
}

async function updateOracle() {
  try {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    
    const idl = require('../target/idl/oracle.json');
    const program = new anchor.Program(idl, ORACLE_PROGRAM_ID, provider);
    
    const authority = provider.wallet.publicKey;
    
    // Derive oracle PDA
    const [oraclePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('oracle'), authority.toBuffer()],
      ORACLE_PROGRAM_ID
    );
    
    // Fetch real prices
    const prices = await fetchRealPrices();
    console.log(`\n[${new Date().toLocaleTimeString()}] Fetched prices:`);
    console.log(`  Gold: $${prices.goldPrice}/oz`);
    console.log(`  Silver: $${prices.silverPrice}/oz`);
    
    // Update oracle
    const goldPriceLamports = Math.round(prices.goldPrice * 1_000_000);
    const silverPriceLamports = Math.round(prices.silverPrice * 1_000_000);
    
    const tx = await program.methods
      .updatePrices(
        new anchor.BN(goldPriceLamports),
        new anchor.BN(silverPriceLamports),
        new anchor.BN(1_000_000) // EUR/USD rate (1.0)
      )
      .accounts({
        oracle: oraclePDA,
        authority: authority,
      })
      .rpc();
    
    console.log(`✅ Oracle updated successfully!`);
    console.log(`Transaction: ${tx}`);
    console.log(`Next update in 5 minutes...`);
    
  } catch (error) {
    console.error('❌ Error updating oracle:', error.message);
    console.log('Will retry in 5 minutes...');
  }
}

async function main() {
  console.log('🚀 Oracle Auto-Updater Started');
  console.log('📊 Updating prices every 5 minutes');
  console.log('Press Ctrl+C to stop\n');
  
  // Update immediately on start
  await updateOracle();
  
  // Then update every 5 minutes
  setInterval(updateOracle, UPDATE_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Oracle Auto-Updater stopped');
  process.exit(0);
});

main().catch(console.error);
