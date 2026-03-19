const fs = require('fs');
const os = require('os');
const path = require('path');
const bs58 = require('bs58');

async function main() {
  console.log('Exporting Private Key for Phantom Wallet\n');
  console.log('==========================================\n');
  
  // Read the keypair file
  const walletPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  
  if (!fs.existsSync(walletPath)) {
    console.log('ERROR: Wallet file not found at:', walletPath);
    console.log('\nMake sure you have a Solana wallet configured.\n');
    process.exit(1);
  }
  
  const keypairData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  
  // Convert to Uint8Array
  const secretKey = Uint8Array.from(keypairData);
  
  // Phantom accepts the private key as a comma-separated array
  const arrayFormat = `[${Array.from(secretKey).join(',')}]`;
  
  // Also provide base58 format (for other wallets)
  const base58PrivateKey = bs58.encode(secretKey);
  
  console.log('Your Wallet Address:');
  console.log('62FizqJWW7j5dzvD9pjgBfjvN8e8tBsDsgHAsfiM39TW\n');
  
  console.log('OPTION 1: Array Format (Copy this for Phantom):');
  console.log('==========================================');
  console.log(arrayFormat);
  console.log('==========================================\n');
  
  console.log('OPTION 2: Base58 Format (For Solflare/Backpack):');
  console.log('==========================================');
  console.log(base58PrivateKey);
  console.log('==========================================\n');
  
  console.log('How to Import to Phantom:\n');
  console.log('1. Install Phantom from https://phantom.app');
  console.log('2. Open Phantom extension');
  console.log('3. Click the hamburger menu (top left)');
  console.log('4. Click "Add / Connect Wallet"');
  console.log('5. Click "Import Private Key"');
  console.log('6. Make sure "Solana" is selected');
  console.log('7. Paste the ARRAY FORMAT from above');
  console.log('8. Give it a name (e.g., "Aurum Dev")');
  console.log('9. Click "Import"\n');
  
  console.log('Switch to Devnet:\n');
  console.log('1. Click settings (gear icon in Phantom)');
  console.log('2. Scroll down to "Developer Settings"');
  console.log('3. Enable "Testnet Mode"');
  console.log('4. Select "Devnet"\n');
  
  console.log('Your Tokens:\n');
  console.log('After importing, you will see:');
  console.log('  - 6.5 SOL (Devnet)');
  console.log('  - 100,000 GOLD tokens');
  console.log('  - 1,000,000 SILVER tokens\n');
  
  console.log('IMPORTANT: Keep this private key secure!');
  console.log('Even though this is testnet, treat it carefully.\n');
  
  // Save to file for easy copying
  fs.writeFileSync('private-key-phantom.txt', arrayFormat);
  console.log('Private key saved to: private-key-phantom.txt');
  console.log('You can copy it from there.\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
