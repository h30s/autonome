# ⚡ Autonome

**The first AI agent that runs its own business on PinionOS.**

Autonome is a self-operating software agent that earns USDC by selling AI-powered on-chain wallet intelligence via an x402 API, spends USDC on PinionOS skills to generate reports, profits from the margin, and auto-reinvests accumulated profits into ETH on Base — all autonomously, all visible in a real-time dashboard.

> *Built for the PinionOS Hackathon*

---

## The Economic Loop

```
User/Agent pays $0.08 via x402
           ↓
  ┌─────────────────────────────────┐
  │     AUTONOME INTELLIGENCE       │
  │                                 │
  │  skills.balance()  → $0.01      │
  │  skills.price()    → $0.01      │
  │  skills.fund()     → $0.01      │
  │  skills.chat()     → $0.01      │
  │  + local analysis  → FREE       │
  │                                 │
  │  Total cost: $0.04              │
  │  Revenue:    $0.08              │
  │  PROFIT:     $0.04 (50%)        │
  └─────────────────────────────────┘
           ↓
  When profit > $0.50:
  skills.trade(USDC → ETH) + skills.broadcast()
  → Reinvestment on-chain ✅
```

## PinionOS SDK Usage

| Feature | How It's Used |
|---|---|
| `createSkillServer` | Runs the x402 paywalled intelligence API |
| `skill()` | Defines `/intel/:address` and `/check/:address` endpoints |
| `PinionClient` | Internal client that calls skills for data |
| `skills.balance()` | Wallet balance lookup for analysis |
| `skills.price()` | ETH price for portfolio valuation |
| `skills.fund()` | Wallet funding status analysis |
| `skills.chat()` | AI-generated risk assessment |
| `skills.trade()` | Autonomous reinvestment: USDC → ETH |
| `skills.broadcast()` | On-chain trade execution |
| `payX402Service` | External x402 service integration |
| `skills.wallet()` | Wallet generation |
| x402 middleware | Automatic payment verification |

## Quick Start

### Prerequisites
- Node.js 18+
- A Base wallet with some ETH (gas) + USDC

### Setup

```bash
git clone https://github.com/<your-username>/autonome
cd autonome
npm install
cp .env.example .env.local
```

Edit `.env.local` with your wallet credentials:
```bash
PINION_PRIVATE_KEY=0xYOUR_KEY
AGENT_WALLET_ADDRESS=0xYOUR_ADDRESS
```

### Run

**Option 1: Full system (agent + dashboard)**
```bash
npm run dev
```

**Option 2: Dashboard only (with demo data)**
```bash
npm run seed           # Pre-populate with demo data
npm run dev:dashboard  # Start the dashboard
```

- Dashboard: http://localhost:3000
- Agent API: http://localhost:4020

### Test the Intelligence API

The agent's API requires x402 payment. Use another PinionClient to call it:

```typescript
import { payX402Service } from "pinion-os";

const result = await payX402Service(
  "http://localhost:4020/intel/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  { privateKey: "0xYOUR_CLIENT_KEY" }
);
console.log(result); // Full intelligence report
```

## Architecture

- **Agent Process** (`npm run agent`): Runs the PinionOS skill server on port 4020 and the profit engine
- **Dashboard** (`npm run dev:dashboard`): Next.js on port 3000, reads from shared SQLite database
- **Database**: SQLite (via `better-sqlite3`) stores all transactions, metrics, agent state
- **Real-time**: Dashboard polls `/api/metrics` every 2 seconds for live updates

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Type-safe throughout |
| PinionOS SDK | Core dependency — all agent operations |
| Next.js 14 | Dashboard with App Router |
| SQLite | Transaction and metrics storage |
| SVG Charts | Custom built, zero dependency |
| Base L2 | Settlement network (USDC) |

## Project Structure

```
src/
├── agent/              # Core agent logic
│   ├── index.ts        # Agent orchestrator (entry point)
│   ├── intelligence.ts # Wallet analysis pipeline
│   ├── profit-engine.ts# Profit tracking + reinvestment
│   ├── skill-server.ts # x402 skill server (earns USDC)
│   ├── event-bus.ts    # Real-time event system
│   └── types.ts        # Type definitions
├── db/
│   └── index.ts        # SQLite schema + queries
├── lib/
│   ├── constants.ts    # Configuration constants
│   └── utils.ts        # Utility functions
└── app/                # Next.js dashboard
    ├── layout.tsx      # Root layout
    ├── page.tsx        # Dashboard UI
    ├── globals.css     # Design system
    └── api/            # API routes
```

## License

MIT

---

*Built with ⚡ by Autonome, powered by [PinionOS](https://pinionos.com)*
