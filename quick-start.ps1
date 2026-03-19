# Quick Start (Windows)
# PowerShell script for Windows users

Write-Host "🚀 Aurum Quick Start" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 20+" -ForegroundColor Red
    exit 1
}

if (!(Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Solana CLI is not installed. Please install Solana CLI" -ForegroundColor Red
    exit 1
}

$SKIP_BUILD = $false
if (!(Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Anchor CLI is not installed. Skipping program build." -ForegroundColor Yellow
    $SKIP_BUILD = $true
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
yarn install
Set-Location frontend
yarn install
Set-Location ..
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Build programs (if Anchor is available)
if (!$SKIP_BUILD) {
    Write-Host "🔨 Building Solana programs..." -ForegroundColor Yellow
    anchor build
    Write-Host "✅ Programs built" -ForegroundColor Green
    Write-Host ""
}

# Check if wallet exists
$WALLET_PATH = "$env:USERPROFILE\.config\solana\id.json"
if (!(Test-Path $WALLET_PATH)) {
    Write-Host "❌ Solana wallet not found at $WALLET_PATH" -ForegroundColor Red
    Write-Host "   Create one with: solana-keygen new" -ForegroundColor Yellow
    exit 1
}

# Check devnet balance
Write-Host "💰 Checking devnet balance..." -ForegroundColor Yellow
$BALANCE = solana balance --url devnet 2>$null
Write-Host "   Balance: $BALANCE"

if ($BALANCE -match "^0") {
    Write-Host "   Requesting airdrop..." -ForegroundColor Yellow
    solana airdrop 2 --url devnet
}
Write-Host ""

# Initialize programs
Write-Host "🎯 Initializing on-chain programs..." -ForegroundColor Yellow
if (Test-Path "scripts\initialize-programs.ts") {
    yarn init
} else {
    Write-Host "⚠️  Initialization script not found. Skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Start frontend
Write-Host "🌐 Starting frontend..." -ForegroundColor Cyan
Write-Host "   The app will be available at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Setup complete! Starting development server..." -ForegroundColor Green
Write-Host ""

Set-Location frontend
yarn dev
