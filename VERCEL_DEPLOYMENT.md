# Vercel Deployment Guide

## Environment Variables

Add these environment variables in your Vercel project settings (Settings → Environment Variables):

```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet

NEXT_PUBLIC_VAULT_PROGRAM_ID=CNThC8D16VAGh3QtDNf3qfr9REsx9AvGfSQ6pEyiv2Yn
NEXT_PUBLIC_ORACLE_PROGRAM_ID=FC952j5bGogrdLzuxxtAEiHRaWhC2v984nRHHvFrcsNp
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=zcqKh45k7YMcD17VPFdf4kg7K26nkNFojdzQdL8gahz
NEXT_PUBLIC_YIELD_OPTIMIZER_PROGRAM_ID=4UP1g7N9ZFvQPvbiSTtXHjPYqFcR32g8BFgHeum4esCS
NEXT_PUBLIC_LENDING_POOL_PROGRAM_ID=D9StNM3VEdCopzf9nTuBqFZKDh8kSNPA4tTC68UneHJs

NEXT_PUBLIC_AUUSD_MINT=AbPkhvGT7TrTZbNNQQeeNMJ7wFCfcWAuZyeV2xYYYaaS
NEXT_PUBLIC_GOLD_MINT=3Kur8AK9jXTfo4urfKSeuSwS5pBVJdk5jMWax9N2brZK
NEXT_PUBLIC_SILVER_MINT=4Rd5B3es21EMqaun4AcqHgfcnkZVGz2Wqy4bTgLUP9a2

NEXT_PUBLIC_VAULT_AUTHORITY=62FizqJWW7j5dzvD9pjgBfjvN8e8tBsDsgHAsfiM39TW
NEXT_PUBLIC_ORACLE_AUTHORITY=62FizqJWW7j5dzvD9pjgBfjvN8e8tBsDsgHAsfiM39TW
```

## Build Configuration

- Framework Preset: Next.js
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node Version: 20.x

## Deployment Steps

1. Push your code to GitHub
2. Import project in Vercel
3. Set root directory to `frontend`
4. Add all environment variables listed above
5. Deploy

## Troubleshooting

### pino-pretty Warning
The build may show a warning about `pino-pretty` not being found. This is expected and won't affect the production build - it's an optional development dependency that's been externalized in the webpack config.

### Build Fails
- Ensure all environment variables are set
- Check that the root directory is set to `frontend`
- Verify Node version is 20.x or higher
