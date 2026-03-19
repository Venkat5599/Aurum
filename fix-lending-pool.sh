#!/bin/bash

echo "🔧 Fixing lending_pool program ID..."

# Generate keypair if it doesn't exist
if [ ! -f "target/deploy/lending_pool-keypair.json" ]; then
    echo "Generating new keypair..."
    solana-keygen new --no-bip39-passphrase -o target/deploy/lending_pool-keypair.json
fi

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/lending_pool-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Update Anchor.toml
echo "Updating Anchor.toml..."
sed -i "s/lending_pool = \"LendP001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\"/lending_pool = \"$PROGRAM_ID\"/" Anchor.toml

# Update declare_id in Rust code
echo "Updating programs/lending_pool/src/lib.rs..."
sed -i "s/declare_id!(\"LendP001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\")/declare_id!(\"$PROGRAM_ID\")/" programs/lending_pool/src/lib.rs

echo "✅ Fixed! Now run:"
echo "   anchor build"
echo "   anchor deploy --provider.cluster devnet"
