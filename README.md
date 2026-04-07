# Eulonomys

Permanent, on-chain eulogies stored on the [Autonomys](https://autonomys.xyz) Distributed Storage Network via Auto Drive. Users pay for storage with the AI3 token through Pay with AI3.

## Prerequisites

- Node.js 22+
- Docker (for local PostgreSQL)

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
  -d postgres:16
```

### 3. Configure environment

```bash
cp .env.example .env
```

The defaults work with the Docker command above. Edit `.env` if you changed any credentials.

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

## Optional Configuration

These are only needed for specific features. The app runs without them.

| Variable | Purpose |
|---|---|
| `LLM_API_KEY` | Enables the AI writing assistant and automated content moderation. Without it, the assistant shows "temporarily unavailable" and moderation flags all public eulogies for manual review. |
| `LLM_API_URL` | OpenAI-compatible endpoint (defaults to OpenAI). |
| `LLM_MODEL` | Model for assistant and moderation (defaults to `gpt-4o-mini`). |
| `ADMIN_EMAIL_DOMAINS` | Comma-separated email domains allowed to access the moderation queue. |
| `ADMIN_WALLETS` | Comma-separated wallet addresses allowed to access the moderation queue. |

See `.env.example` for the full list.

## Project Structure

```
src/
  app/                    # Next.js App Router pages and API routes
    create/               # Eulogy creation (edit -> preview -> pay -> upload)
    eulogy/[cid]/         # Eulogy detail + CID verification
    browse/               # Public eulogy browser with search
    sponsors/             # Community escrow fund
    admin/moderation/     # Moderation queue (admin only)
    guidelines/           # Community guidelines
    api/                  # API routes (upload, payment, escrow, moderation, ai-assistant)
  components/             # React components
  services/               # Business logic with interface + stub pattern
  providers/              # Web3 (wagmi) and Auth context providers
  config/                 # App configuration
  types/                  # TypeScript type definitions
  lib/                    # Prisma client
prisma/
  schema.prisma           # Database schema
```

## Architecture Notes

**Stub pattern:** Auto Drive uploads, Pay with AI3 payments, and escrow are all behind service interfaces with stub implementations. When the real APIs are available, swap the implementation without touching the rest of the app.

**Prisma 7:** Uses the adapter-based client (`@prisma/adapter-pg`). The `PrismaClient` constructor requires an adapter — there is no implicit database connection. Connection URL is configured in both `prisma.config.ts` (for CLI tools) and `src/lib/prisma.ts` (for the runtime client).

**Auto Drive auth:** The third-party integration pattern does not yet exist. The `AuthProvider` and `AutoDriveClient` abstractions are designed to be swapped once the pattern is defined.

## License

MIT
