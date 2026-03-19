const anchor = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
const axios = require('axios');

const ORACLE_PROGRAM_ID = new PublicKey('FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp');

async function fetchRealPrices() {
  try {
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
    console.log('Using fallback prices');
  }

  return {
    goldPrice: 2650.00,
    silverPrice: 31.50,
  };
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const idl = require('../target/idl/oracle.json');
  const program = new anchor.Program(idl, ORACLE_PROGRAM_ID, provider);
  
  const authority = provider.wallet.publicKey;
  const [oraclePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('oracle'), authority.toBuffer()],
    ORACLE_PROGRAM_ID
  );
  
  const prices = await fetchRealPrices();
  console.log(`\n📊 Updating oracle with:`);
  console.log(`  Gold: $${prices.goldPrice}/oz`);
  console.log(`  Silver: $${prices.silverPrice}/oz`);
  
  const goldPriceLamports = Math.round(prices.goldPrice * 1_000_000);
  const silverPriceLamports = Math.round(prices.silverPrice * 1_000_000);
  
  const tx = await program.methods
    .updatePrices(
      new anchor.BN(goldPriceLamports),
      new anchor.BN(silverPriceLamports),
      new anchor.BN(1_000_000)
    )
    .accounts({
      oracle: oraclePDA,
      authority: authority,
    })
    .rpc();
  
  console.log(`✅ Oracle updated!`);
  console.log(`Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main().catch(console.error);
