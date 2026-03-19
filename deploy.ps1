# Aurum Deployment Script (PowerShell)
# This script automates the deployment of Aurum programs to Solana Devnet

$ErrorActionPreference = "Stop"

Write-Host "🚀 Aurum Deployment Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

$commands = @("solana", "anchor", "node")
foreach ($cmd in $commands) {
    if (!(Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "❌ $cmd not found. Please install it first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All prerequisites installed" -ForegroundColor Green
Write-Host ""

# Check Solana configuration
Write-Host "🔧 Checking Solana configuration..." -ForegroundColor Yellow
$config = solana config get
$cluster = ($config | Select-String "RPC URL").ToString().Split()[-1]
Write-Host "Current cluster: $cluster"

if ($cluster -notlike "*devnet*") {
    Write-Host "⚠️  Not on devnet. Switching to devnet..." -ForegroundColor Yellow
    solana config set --url devnet
}

# Check balance
Write-Host ""
Write-Host "💰 Checking wallet balance..." -ForegroundColor Yellow
$wallet = solana address
Write-Host "Wallet address: $wallet"

$balance = (solana balance).Split()[0]
Write-Host "Balance: $balance SOL"

if ([double]$balance -lt 1) {
    Write-Host "⚠️  Low balance. You need at least 1 SOL for deployment." -ForegroundColor Yellow
    Write-Host "Requesting airdrop..."
    try {
        solana airdrop 2
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Airdrop failed. Please use a faucet: https://faucet.solana.com" -ForegroundColor Yellow
    }
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "yarn.lock") {
    yarn install
} elseif (Test-Path "package-lock.json") {
    npm install
} else {
    npm install
}

# Clean previous builds
Write-Host ""
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
anchor clean

# Build programs
Write-Host ""
Write-Host "🔨 Building programs..." -ForegroundColor Yellow
anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy programs
Write-Host ""
Write-Host "🚀 Deploying programs to devnet..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes..."
Write-Host ""

anchor deploy --provider.cluster devnet 2>&1 | Tee-Object -FilePath deploy_output.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Check deploy_output.txt for details." -ForegroundColor Red
    Get-Content deploy_output.txt
    exit 1
}

Write-Host "✅ Deployment successful" -ForegroundColor Green
Write-Host ""

# Extract program IDs
Write-Host "📝 Extracting program IDs..." -ForegroundColor Yellow
Write-Host ""

$deployOutput = Get-Content deploy_output.txt
$programIds = $deployOutput | Select-String "Program Id: " | ForEach-Object { $_.ToString().Split()[-1] }

$vaultId = $programIds[0]
$complianceId = $programIds[1]
$oracleId = $programIds[2]
$yieldId = $programIds[3]

Write-Host "Vault Program ID:           $vaultId"
Write-Host "Compliance Program ID:      $complianceId"
Write-Host "Oracle Program ID:          $oracleId"
Write-Host "Yield Optimizer Program ID: $yieldId"
Write-Host ""

# Create .env file
Write-Host "📄 Creating .env file..." -ForegroundColor Yellow

$envContent = @"
# Solana Configuration
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

# Program IDs (Deployed on $(Get-Date))
NEXT_PUBLIC_VAULT_PROGRAM_ID=$vaultId
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=$complianceId
NEXT_PUBLIC_ORACLE_PROGRAM_ID=$oracleId
NEXT_PUBLIC_YIELD_PROGRAM_ID=$yieldId

# These will be set after initialization
NEXT_PUBLIC_AUUSD_MINT=
NEXT_PUBLIC_ORACLE_DATA=
NEXT_PUBLIC_VAULT=
"@

$envContent | Out-File -FilePath .env -Encoding UTF8

Write-Host "✅ .env file created" -ForegroundColor Green
Write-Host ""

# Update Anchor.toml
Write-Host "📄 Updating Anchor.toml..." -ForegroundColor Yellow

# Backup original
Copy-Item Anchor.toml Anchor.toml.backup

# Read and update Anchor.toml
$anchorToml = Get-Content Anchor.toml
$anchorToml = $anchorToml -replace 'vault = ".*"', "vault = `"$vaultId`""
$anchorToml = $anchorToml -replace 'compliance = ".*"', "compliance = `"$complianceId`""
$anchorToml = $anchorToml -replace 'oracle = ".*"', "oracle = `"$oracleId`""
$anchorToml = $anchorToml -replace 'yield_optimizer = ".*"', "yield_optimizer = `"$yieldId`""
$anchorToml | Out-File -FilePath Anchor.toml -Encoding UTF8

Write-Host "✅ Anchor.toml updated" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "🎉 Deployment Complete!" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Program IDs have been saved to:"
Write-Host "  - .env (for frontend)"
Write-Host "  - Anchor.toml (for testing)"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run initialization: ts-node scripts/initialize.ts"
Write-Host "  2. Update frontend/.env.local with program IDs"
Write-Host "  3. Deploy frontend: cd frontend; vercel"
Write-Host "  4. Test the application"
Write-Host ""
Write-Host "View your programs on Solana Explorer:"
Write-Host "  https://explorer.solana.com/address/$vaultId`?cluster=devnet"
Write-Host ""
Write-Host "Deployment log saved to: deploy_output.txt"
Write-Host ""
Write-Host "✅ All done! Happy hacking! 🚀" -ForegroundColor Green
