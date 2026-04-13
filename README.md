# Eulonomys

Permanent, on-chain eulogies stored on the [Autonomys](https://autonomys.xyz) Distributed Storage Network via [Auto Drive](https://docs.autonomys.xyz/auto-drive). Users pay for storage with the AI3 token through Pay with AI3.

## Why This Exists

Eulonomys is a **reference implementation** for [Pay with AI3](https://docs.autonomys.xyz), the permissionless payment layer for permanent storage on the Autonomys Network. It demonstrates what becomes possible when anyone can purchase immutable, verifiable storage without intermediaries.

The emotional weight of the use case — preserving memories of loved ones forever — makes the permanence guarantee tangible in a way that abstract storage demos cannot. But the real purpose is to serve as a **blueprint for developers** building their own apps against Auto Drive.

Every architectural decision is made with one question in mind: *"What would a developer building their own app need here?"*

### What This Showcases

- **Pay with AI3 intent flow** — create intent, on-chain `payIntent(bytes32)`, watch transaction, poll for credit completion
- **Auto Drive SDK integration** — file uploads via `@autonomys/auto-drive`, gateway retrieval by CID
- **Wallet interaction** — wagmi v2 contract calls on Auto EVM (chain ID 870), with the explicit `gasPrice` workaround for MetaMask compatibility
- **Platform/merchant pattern** — the app holds the Auto Drive API key and credits; users pay AI3 to the app, which spends credits on their behalf

### Integration Patterns Worth Studying

| Pattern | Location | Notes |
|---|---|---|
| Intent-based payment | `src/services/payment.ts` | REST API calls to Auto Drive `/intents` endpoint |
| On-chain contract call | `src/components/PaymentFlow.tsx` | `payIntent(bytes32)` via wagmi with gasPrice fix |
| SDK file upload | `src/services/autoDrive.ts` | Buffer upload with compression |
| CID verification | `src/components/VerifyButton.tsx` | Fetch from gateway, confirm content matches CID |
| Service interface pattern | `src/services/*.ts` | Swappable implementations behind interfaces |

## Prerequisites

- Node.js 22+
- Docker (for local PostgreSQL)
- An [Auto Drive API key](https://docs.autonomys.xyz/auto-drive) with credits
- A wallet with AI3 on Autonomys mainnet (chain ID 870)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL

```bash
docker run --name eulonomys-db \
  -e POSTGRES_DB=eulonomys \
  -e POSTGRES_USER=eulonomys \
  -e POSTGRES_PASSWORD=eulonomys \
  -p 5432:5432 \
  -d postgres:17
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults work with the Docker command above. You will need to set:

- `AUTO_DRIVE_API_KEY` — your Auto Drive API key (required for uploads and payments)
- `ADMIN_WALLETS` — comma-separated wallet addresses for moderation access

See `.env.example` for the full list.

### 4. Run database migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration Reference

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTO_DRIVE_API_KEY` | Auto Drive API key — uploads and payment intents use this |

### Network

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CHAIN_ID` | `870` | Autonomys EVM chain ID (870 = mainnet, 8700 = Chronos testnet) |
| `NEXT_PUBLIC_AUTONOMYS_RPC_URL` | `https://auto-evm.mainnet.autonomys.xyz/ws` | Auto EVM RPC endpoint |
| `NEXT_PUBLIC_CREDITS_RECEIVER_ADDRESS` | `0xBa5bed...5cbf7` | AutoDriveCreditsReceiver contract |
| `NEXT_PUBLIC_BLOCK_EXPLORER_URL` | `https://explorer.auto-evm.mainnet.autonomys.xyz` | Block explorer for tx links |

### Optional

| Variable | Purpose |
|---|---|
| `ADMIN_WALLETS` | Comma-separated wallet addresses for moderation queue access. Admins authenticate via signed nonce at `/admin/moderation`. |
| `NEXT_PUBLIC_ESCROW_WALLET_ADDRESS` | Wallet that receives community fund contributions. If unset, the contribute form is disabled. |
| `LLM_API_KEY` | Enables the AI writing assistant and automated content moderation. Without it, the assistant is unavailable and moderation auto-approves in development. |
| `LLM_API_URL` | OpenAI-compatible endpoint (defaults to OpenAI). |
| `LLM_MODEL` | Model for assistant and moderation (defaults to `gpt-4o-mini`). |

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    create/               # Eulogy creation (edit -> preview -> pay -> upload)
    eulogy/[cid]/         # Eulogy detail + CID verification
    browse/               # Public eulogy browser with search
    sponsors/             # Community fund
    admin/moderation/     # Moderation queue (wallet-authenticated)
    guidelines/           # Community guidelines
    api/
      payment/            # Intent creation, tx watching, status polling
      upload/             # File upload to Auto Drive
      escrow/             # Community fund contributions
      moderation/         # Approve/reject (session token auth)
      admin/              # Nonce generation + wallet verification
      ai-assistant/       # Writing assistant
  components/             # React components
  services/               # Business logic (payment, autoDrive, escrow, moderation)
  hooks/                  # Custom hooks (admin auth)
  providers/              # Web3 (wagmi) and Auth context providers
  config/                 # App config and contract ABI
  types/                  # TypeScript type definitions
  lib/                    # Prisma client, nonce/session store
prisma/
  schema.prisma           # Database schema
```

## Architecture Notes

### Pay with AI3 Flow

1. Frontend estimates cost and creates an intent via `POST /intents` on the Auto Drive API
2. User sends AI3 to the `AutoDriveCreditsReceiver` contract via `payIntent(intentId)` — the `intentId` is a `bytes32` value returned by the API, passed directly
3. App submits the tx hash to `POST /intents/:id/watch`
4. Frontend polls `GET /intents/:id` until status is `completed`
5. Credits land on the app's Auto Drive account; upload proceeds

### Auto EVM Gas Price

Auto EVM does not support EIP-1559 fee history (`eth_feeHistory`). MetaMask fails to estimate fees on custom networks. The fix: fetch `eth_gasPrice` + 1 GWEI buffer and pass `gasPrice` explicitly, forcing a legacy (type-0) transaction. See `PaymentFlow.tsx` and [autonomys/auto-drive#652](https://github.com/autonomys/auto-drive/pull/652).

### Admin Security

Moderation uses a challenge-response flow: the server issues a one-time nonce, the admin signs it with their wallet, the server verifies the signature and issues a 15-minute session token. The session token (Bearer auth) is used for all subsequent moderation API calls. Raw signatures are never reused. See `src/hooks/useAdminAuth.ts` and `src/app/api/admin/`.

### Prisma 7

Uses the adapter-based client (`@prisma/adapter-pg`). The `PrismaClient` constructor requires an adapter — there is no implicit database connection. Connection URL is configured in both `prisma.config.ts` (for CLI tools) and `src/lib/prisma.ts` (for the runtime client).

## License

MIT
