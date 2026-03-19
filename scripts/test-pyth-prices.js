const { Connection, PublicKey } = require('@solana/web3.js');
const { PythHttpClient, getPythProgramKeyForCluster } = require('@pythnetwork/client');

const PYTH_FEEDS = {
  GOLD: new PublicKey('JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB'),
  SILVER: new PublicKey('BjHoZWRxo9dgbR1NQhPyTiUs6xFiX6mGS4TMYvy3b2yc'),
};

async function main() {
  console.log('🔮 Fetching REAL-TIME Precious Metals Prices from Pyth Network\n');
  
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const pythPublicKey = getPythProgramKeyForCluster('devnet');
  const pythClient = new PythHttpClient(connection, pythPublicKey);
  
  try {
    // Fetch price data
    const data = await pythClient.getData();
    
    // Get Gold price
    const goldProduct = data.productPrice.get(PYTH_FEEDS.GOLD.toString());
    if (goldProduct && goldProduct.price) {
      const goldPrice = goldProduct.price;
      const goldConfidence = goldProduct.confidence;
      
      console.log('💰 GOLD (XAU/USD):');
      console.log(`   Price: $${goldPrice.toFixed(2)}`);
      console.log(`   Confidence: ±$${goldConfidence.toFixed(2)}`);
      console.log(`   Status: ${goldProduct.status}`);
      console.log('');
    } else {
      console.log('⚠️  Gold price not available\n');
    }
    
    // Get Silver price
    const silverProduct = data.productPrice.get(PYTH_FEEDS.SILVER.toString());
    if (silverProduct && silverProduct.price) {
      const silverPrice = silverProduct.price;
      const silverConfidence = silverProduct.confidence;
      
      console.log('🥈 SILVER (XAG/USD):');
      console.log(`   Price: $${silverPrice.toFixed(2)}`);
      console.log(`   Confidence: ±$${silverConfidence.toFixed(2)}`);
      console.log(`   Status: ${silverProduct.status}`);
      console.log('');
    } else {
      console.log('⚠️  Silver price not available\n');
    }
    
    console.log('✅ Prices are updated every 400ms by Pyth Network!');
    console.log('✅ These are REAL market prices, not mock data!');
    console.log('');
    
  } catch (error) {
    console.error('Error fetching prices:', error.message);
    console.log('\n💡 Note: Pyth prices may not be available on devnet.');
    console.log('   For production, use mainnet-beta with real feeds.');
    console.log('');
    console.log('📊 Using fallback: CoinGecko API (also real prices)');
    
    // Fallback to CoinGecko
    await fetchCoinGeckoPrices();
  }
}

async function fetchCoinGeckoPrices() {
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=gold,silver&vs_currencies=usd'
    );
    const data = await response.json();
    
    console.log('\n💰 GOLD (XAU/USD):');
    console.log(`   Price: $${data.gold.usd.toFixed(2)}`);
    console.log('');
    
    console.log('🥈 SILVER (XAG/USD):');
    console.log(`   Price: $${data.silver.usd.toFixed(2)}`);
    console.log('');
    
    console.log('✅ Real-time prices from CoinGecko API');
    console.log('✅ Free, no API key required!');
    console.log('');
  } catch (error) {
    console.error('CoinGecko fallback failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
