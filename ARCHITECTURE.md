# StableSwift Architecture

## System Overview

StableSwift is a multi-tier application that bridges traditional payment systems with Solana blockchain infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Merchant Dashboard│         │  Payment Page    │         │
│  │   (Next.js SPA)  │         │  (Hosted Checkout)│         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Backend API (Node.js/Express)           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Payment   │  │  Merchant  │  │ Compliance │    │  │
│  │  │ Processor  │  │  Service   │  │  Service   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Solana Programs (Anchor/Rust)              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │  Payment   │  │  Merchant  │  │ Compliance │    │  │
│  │  │  Escrow    │  │   Vault    │  │   Module   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Circle  │  │  AMINA   │  │ Moonpay  │  │ Jupiter  │  │
│  │  (USDC)  │  │  Bank    │  │ (Cards)  │  │ (Swaps)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js)

**Merchant Dashboard** (`/app/dashboard`)
- Account management
- Invoice creation
- Payment history
- Withdrawal management
- Analytics and reporting

**Payment Page** (`/app/pay/[id]`)
- Hosted checkout experience
- Wallet connection (Phantom, Coinbase)
- Credit card payment form
- Payment confirmation

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- React Query (data fetching)
- Zustand (state management)

### 2. Backend API (Node.js)

**Services:**

**Payment Processor** (`/backend/services/payment-processor`)
- Handle incoming payments
- Validate transactions
- Update payment status
- Trigger webhooks

**Merchant Service** (`/backend/services/merchant`)
- Merchant onboarding
- KYC verification
- Vault management
- Invoice generation

**Compliance Service** (`/backend/services/compliance`)
- Sanctions screening
- Transaction monitoring
- Risk assessment
- Audit logging

**Withdrawal Service** (`/backend/services/withdrawal`)
- Bank withdrawal processing
- Currency conversion
- Fee calculation
- Status tracking

**Tech Stack:**
- Node.js + Express
- TypeScript
- PostgreSQL (primary database)
- Redis (caching, queues)
- Bull (job queues)
- Prisma (ORM)

### 3. Solana Programs (Anchor)

**Payment Escrow Program**
```rust
// Holds payments until confirmed
pub struct PaymentEscrow {
    pub merchant: Pubkey,
    pub customer: Pubkey,
    pub amount: u64,
    pub status: PaymentStatus,
    pub created_at: i64,
    pub expires_at: i64,
}

// Instructions
- initialize_escrow
- deposit_payment
- release_payment
- refund_payment
- cancel_escrow
```

**Merchant Vault Program**
```rust
// Manages merchant funds
pub struct MerchantVault {
    pub owner: Pubkey,
    pub authority: Pubkey,
    pub balance: u64,
    pub withdrawal_limit: u64,
    pub last_withdrawal: i64,
}

// Instructions
- initialize_vault
- deposit
- withdraw
- update_limits
- transfer_authority
```

**Compliance Module**
```rust
// Transfer hook for compliance checks
pub struct ComplianceCheck {
    pub merchant: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub is_sanctioned: bool,
    pub risk_score: u8,
}

// Instructions
- check_sanctions
- add_to_blacklist
- remove_from_blacklist
- freeze_account
- unfreeze_account
```

## Data Flow

### Payment Flow (Crypto Wallet)

```
1. Customer clicks payment link
   ↓
2. Frontend loads payment details from API
   ↓
3. Customer connects wallet (Phantom)
   ↓
4. Frontend creates escrow transaction
   ↓
5. Customer approves transaction
   ↓
6. Solana program validates and holds funds
   ↓
7. Backend detects transaction (Helius webhook)
   ↓
8. Compliance service screens transaction
   ↓
9. If approved, program releases to merchant vault
   ↓
10. Backend updates payment status
   ↓
11. Merchant receives notification
   ↓
12. Customer receives confirmation
```

### Payment Flow (Credit Card)

```
1. Customer clicks payment link
   ↓
2. Customer enters card details
   ↓
3. Frontend sends to backend API
   ↓
4. Backend calls Moonpay API
   ↓
5. Moonpay charges card and buys USDC
   ↓
6. Moonpay sends USDC to our hot wallet
   ↓
7. Backend creates escrow transaction
   ↓
8. Solana program validates and holds funds
   ↓
9. Compliance service screens transaction
   ↓
10. If approved, program releases to merchant vault
   ↓
11. Backend updates payment status
   ↓
12. Merchant receives notification
   ↓
13. Customer receives confirmation
```

### Withdrawal Flow

```
1. Merchant requests withdrawal
   ↓
2. Backend validates request
   ↓
3. If currency conversion needed:
   - Call Jupiter API for swap
   - Execute swap transaction
   ↓
4. Create withdrawal transaction from vault
   ↓
5. Solana program validates and transfers
   ↓
6. Backend calls Circle/AMINA API
   ↓
7. Circle/AMINA processes bank transfer
   ↓
8. Backend updates withdrawal status
   ↓
9. Merchant receives notification
   ↓
10. Funds arrive in bank (1 business day)
```

## Database Schema

### Merchants
```sql
CREATE TABLE merchants (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    vault_address VARCHAR(44) NOT NULL,
    kyc_status VARCHAR(20) NOT NULL,
    preferred_currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Invoices
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id),
    customer_email VARCHAR(255),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_url VARCHAR(255),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);
```

### Payments
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id),
    transaction_signature VARCHAR(88) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP
);
```

### Withdrawals
```sql
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id),
    amount BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,
    bank_account VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    transaction_signature VARCHAR(88),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## Security Considerations

### Smart Contract Security
- All programs use Anchor's security checks
- Multi-sig required for vault authority changes
- Time-locks on large withdrawals (> $50k)
- Emergency pause functionality
- Reentrancy guards on all state-changing functions

### API Security
- JWT authentication for all endpoints
- Rate limiting (100 req/min per IP)
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- CORS restrictions
- API key rotation every 90 days

### Data Security
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII data encrypted in database
- Secrets stored in AWS Secrets Manager
- Regular security audits
- Bug bounty program

### Compliance
- KYC/AML via AMINA Bank
- Real-time OFAC sanctions screening
- Transaction monitoring (Chainalysis)
- Audit trail (immutable on-chain)
- GDPR compliance
- SOC 2 Type II (pending)

## Scalability

### Current Capacity
- 1,000 payments/second
- 10,000 concurrent users
- 99.9% uptime SLA

### Scaling Strategy
- Horizontal scaling (Kubernetes)
- Database read replicas
- Redis caching layer
- CDN for static assets (Cloudflare)
- Load balancing (AWS ALB)
- Auto-scaling based on metrics

### Performance Optimization
- Database indexing on frequently queried fields
- Query optimization (N+1 prevention)
- Caching strategy (Redis)
- Asset optimization (Next.js)
- Code splitting and lazy loading
- WebSocket for real-time updates

## Monitoring & Observability

### Metrics
- Payment success rate
- Average transaction time
- API response times
- Error rates
- User activity

### Logging
- Structured logging (JSON)
- Log aggregation (Datadog)
- Error tracking (Sentry)
- Audit logs (immutable)

### Alerting
- PagerDuty for critical alerts
- Slack for warnings
- Email for info notifications

## Disaster Recovery

### Backup Strategy
- Database backups every 6 hours
- Point-in-time recovery (7 days)
- Cross-region replication
- Backup testing monthly

### Recovery Plan
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 6 hours
- Documented runbooks
- Regular DR drills

## Development Workflow

### Environments
- **Local**: Developer machines
- **Development**: Shared dev environment (Solana Devnet)
- **Staging**: Pre-production testing (Solana Testnet)
- **Production**: Live environment (Solana Mainnet)

### CI/CD Pipeline
```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions runs tests
   ↓
3. If tests pass, build Docker images
   ↓
4. Deploy to staging environment
   ↓
5. Run integration tests
   ↓
6. Manual approval required
   ↓
7. Deploy to production
   ↓
8. Run smoke tests
   ↓
9. Monitor for errors
```

### Testing Strategy
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- Smart contract tests (Anchor)
- Load tests (k6)
- Security tests (OWASP ZAP)

## Future Enhancements

### Phase 2 (Q2 2026)
- Recurring payments
- Subscription management
- Multi-currency invoicing
- Advanced analytics

### Phase 3 (Q3 2026)
- Mobile app (React Native)
- White-label solution
- API marketplace
- Plugin ecosystem

### Phase 4 (Q4 2026)
- Cross-chain support (Ethereum, Polygon)
- DeFi integrations (lending, yield)
- Payment financing
- Crypto credit cards
