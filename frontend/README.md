# Aurum Frontend

Modern Next.js frontend for the Aurum programmable commodity vault.

## Features

- 🎨 Clean, institutional design with cream/gold aesthetic
- 💼 Professional dashboard for minting, redeeming, and managing auUSD
- 🔐 Integrated Solana wallet support (Phantom, Solflare, Backpack)
- 📊 Real-time oracle pricing and yield analytics
- ✅ Compliance portal with KYC/KYT status
- 📱 Fully responsive design

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS
- **Wallet:** @solana/wallet-adapter-react
- **State:** Zustand + TanStack Query
- **Icons:** Lucide React
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.local.example .env.local

# Update .env.local with your program IDs
```

### Development

```bash
# Start development server
yarn dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
yarn build

# Start production server
yarn start
```

## Project Structure

```
frontend/
├── app/
│   ├── dashboard/          # Dashboard page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── providers.tsx       # Context providers
├── components/             # Reusable components
│   ├── Button.tsx
│   └── Card.tsx
├── lib/
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_VAULT_PROGRAM_ID=your_vault_program_id
NEXT_PUBLIC_COMPLIANCE_PROGRAM_ID=your_compliance_program_id
NEXT_PUBLIC_ORACLE_PROGRAM_ID=your_oracle_program_id
NEXT_PUBLIC_YIELD_OPTIMIZER_PROGRAM_ID=your_yield_program_id
NEXT_PUBLIC_AUUSD_MINT=your_auusd_mint_address
NEXT_PUBLIC_CLUSTER=devnet
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Other Platforms

Build the app and deploy the `.next` folder:

```bash
yarn build
```

## Customization

### Colors

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --background: 42 45% 94%;    /* Cream background */
  --foreground: 25 35% 12%;    /* Dark brown text */
  --primary: 45 93% 47%;       /* Gold accent */
  /* ... */
}
```

### Fonts

Update `app/layout.tsx` to change fonts:

```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })
```

## License

MIT
