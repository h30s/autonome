# ⚡ Autonome

**The first AI agent that runs its own business on PinionOS.**

Autonome is a self-operating software agent that earns USDC by selling AI-powered on-chain wallet intelligence via an x402 API, spends USDC on PinionOS skills to generate reports, profits from the margin, and auto-reinvests accumulated profits into ETH on Base — all autonomously, all visible in a real-time dashboard.

> *Built for the PinionOS Hackathon*

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTONOME SYSTEM                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              NEXT.JS APPLICATION                     │   │
│  │                                                      │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │  Dashboard  │  │  API Routes  │  │  SSE Events  │ │   │
│  │  │  (React)    │  │  (Next API)  │  │  Endpoint    │ │   │
│  │  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘ │   │
│  │         │                │                  │        │   │
│  └─────────┼────────────────┼──────────────────┼────────┘   │
│            │                │                  │            │
│  ┌─────────┼────────────────┼──────────────────┼──────────┐ │
│  │         ▼                ▼                  ▼          │ │
│  │              AGENT CORE (TypeScript)                   │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Skill Server │  │  Pinion      │  │  Profit      │  │ │
│  │  │ (Earns USDC) │  │  Client      │  │  Engine      │  │ │
│  │  │              │  │  (Spends)    │  │  (Reinvests) │  │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │ │
│  │         │                 │                  │         │ │
│  │  ┌──────┴─────────────────┴──────────────────┴───────┐ │ │
│  │  │              Event Bus (EventEmitter)             │ │ │
│  │  └──────────────────────┬────────────────────────────┘ │ │
│  │                         │                              │ │
│  │  ┌──────────────────────┴────────────────────────────┐ │ │
│  │  │              SQLite Database                      │ │ │
│  │  │  (transactions, metrics, agent state)             │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                   │
│            ┌────────────┼────────────┐                      │
│            ▼            ▼            ▼                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│    │PinionOS  │  │ External │  │  Base L2  │                │
│    │Skill API │  │ x402 APIs│  │  Network  │                │
│    │$0.01/call│  │(payX402) │  │  (USDC)   │                │
│    └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

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
| `payX402Service` | External x402 data enrichment in intelligence pipeline |
| `spend_limit` | Session budget tracking on dashboard |
| x402 middleware | Automatic payment verification (via `createSkillServer`) |
| `/catalog` endpoint | Auto-generated skill discovery (via `createSkillServer`) |

## Quick Start

### Prerequisites
- Node.js 18+
- A Base wallet with some ETH (gas) + USDC

### Setup

```bash
git clone https://github.com/h30s/autonome
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

**Option 2: Dashboard with demo data**
```bash
npm run demo   # Seeds data + starts everything
```

**Option 3: Dashboard only**
```bash
npm run seed           # Pre-populate with demo data
npm run dev:dashboard  # Start the dashboard
```

- Dashboard: http://localhost:3000
- Agent API: http://localhost:4020

### Test the Intelligence Pipeline

```bash
npm run test:intel                          # Uses default address
npm run test:intel -- 0xYOUR_ADDRESS_HERE   # Custom address
```

### Test the Intelligence API

The agent's API requires x402 payment. Use another PinionClient to call it:

```typescript
import { PinionClient, payX402Service } from "pinion-os";

const pinion = new PinionClient({ privateKey: "0xYOUR_CLIENT_KEY" });
const result = await payX402Service(
  pinion.signer,
  "http://localhost:4020/intel/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
);
console.log(result); // Full intelligence report
```

## Architecture Details

- **Agent Process** (`npm run agent`): Runs the PinionOS skill server on port 4020 and the profit engine
- **Dashboard** (`npm run dev:dashboard`): Next.js on port 3000, reads from shared SQLite database
- **Database**: SQLite (via `better-sqlite3`) stores all transactions, metrics, agent state
- **Real-time**: SSE endpoint at `/api/events` + dashboard polling for live updates

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/metrics` | GET | Current agent metrics (revenue, expenses, profit) |
| `/api/transactions` | GET | Recent transaction history |
| `/api/timeseries` | GET | Time-series data for charts |
| `/api/agent/status` | GET | Agent status and wallet info |
| `/api/agent/start` | POST | Start the agent |
| `/api/agent/stop` | POST | Stop the agent |
| `/api/intel` | POST | Trigger demo intelligence report |
| `/api/events` | GET | SSE stream for real-time updates |

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Type-safe throughout |
| PinionOS SDK | Core dependency — all agent operations |
| Next.js 14 | Dashboard with App Router |
| SQLite | Transaction and metrics storage |
| SVG Charts | Custom-built profit charts, zero dependency |
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
│   ├── pinion.ts       # PinionClient singleton
│   ├── constants.ts    # Configuration constants
│   └── utils.ts        # Utility functions
└── app/                # Next.js dashboard
    ├── layout.tsx      # Root layout
    ├── page.tsx        # Dashboard page (data fetching)
    ├── globals.css     # Design system
    ├── components/     # Extracted UI components
    │   ├── Dashboard.tsx     # Main layout assembler
    │   ├── Header.tsx        # Brand header with status
    │   ├── MetricsPanel.tsx  # Revenue/expenses/profit cards
    │   ├── ProfitChart.tsx   # SVG line chart
    │   ├── WalletStatus.tsx  # Balance display + reinvest progress
    │   ├── ActivityFeed.tsx  # Real-time transaction log
    │   ├── ReinvestLog.tsx   # Reinvestment history table
    │   └── AgentControls.tsx # Start/stop/demo buttons
    └── api/            # API routes
        ├── metrics/         # GET metrics
        ├── transactions/    # GET transactions
        ├── timeseries/      # GET chart data
        ├── events/          # SSE stream
        ├── intel/           # POST demo intel trigger
        └── agent/
            ├── status/      # GET agent status
            ├── start/       # POST start agent
            └── stop/        # POST stop agent
```

## License

MIT

---

*Built with ⚡ by Autonome, powered by [PinionOS](https://pinionos.com)*
