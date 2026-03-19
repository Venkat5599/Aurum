const { Connection, PublicKey } = require('@solana/web3.js');

// Pyth Network price feeds on Solana Devnet
const PYTH_FEEDS = {
  // Gold price feed (XAU/USD)
  GOLD: 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB',
  // Silver price feed (XAG/USD)  
  SILVER: 'BjHoZWRxo9dgbR1NQhPyTiUs6xFiX6mGS4TMYvy3b2yc',
};

async function main() {
  console.log('🔮 Setting up Pyth Oracle Integration\n');
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  console.log('📊 Pyth Network Price Feeds (Devnet):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Gold (XAU/USD):   ${PYTH_FEEDS.GOLD}`);
  console.log(`Silver (XAG/USD): ${PYTH_FEEDS.SILVER}`);
  console.log('');
  
  // Verify feeds exist
  console.log('✅ Verifying price feeds...\n');
  
  try {
    const goldAccount = await connection.getAccountInfo(new PublicKey(PYTH_FEEDS.GOLD));
    if (goldAccount) {
      console.log('✅ Gold price feed verified');
    } else {
      console.log('⚠️  Gold price feed not found');
    }
    
    const silverAccount = await connection.getAccountInfo(new PublicKey(PYTH_FEEDS.SILVER));
    if (silverAccount) {
      console.log('✅ Silver price feed verified');
    } else {
      console.log('⚠️  Silver price feed not found');
    }
  } catch (error) {
    console.log('⚠️  Could not verify feeds:', error.message);
  }
  
  console.log('\n📝 Integration Instructions:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Add Pyth SDK to your project:');
  console.log('   npm install @pythnetwork/client');
  console.log('');
  console.log('2. Update your oracle program to read from Pyth feeds');
  console.log('');
  console.log('3. Use these feed addresses in your program:');
  console.log(`   Gold:   ${PYTH_FEEDS.GOLD}`);
  console.log(`   Silver: ${PYTH_FEEDS.SILVER}`);
  console.log('');
  console.log('✅ Pyth provides REAL-TIME prices updated every 400ms!');
  console.log('✅ No API key needed');
  console.log('✅ Free on devnet');
  console.log('');
  
  // Update .env file
  const fs = require('fs');
  let envContent = fs.readFileSync('.env.example', 'utf-8');
  
  // Add Pyth feeds if not already there
  if (!envContent.includes('PYTH_GOLD_FEED')) {
    envContent += `\n# Pyth Network Price Feeds (Real-time)\nNEXT_PUBLIC_PYTH_GOLD_FEED=${PYTH_FEEDS.GOLD}\nNEXT_PUBLIC_PYTH_SILVER_FEED=${PYTH_FEEDS.SILVER}\n`;
    fs.writeFileSync('.env.example', envContent);
    fs.writeFileSync('frontend/.env.local', envContent);
    console.log('✅ Updated .env files with Pyth feed addresses\n');
  }
  
  console.log('🎯 Next Steps:');
  console.log('1. Install Pyth SDK: npm install @pythnetwork/client');
  console.log('2. Run: node scripts/test-pyth-prices.js (to see live prices)');
  console.log('3. Your oracle will now use REAL market prices!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
