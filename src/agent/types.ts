// Agent type definitions for Autonome

export interface AgentConfig {
    privateKey: string;
    walletAddress: string;
    network: "base" | "base-sepolia";
    skillServerPort: number;
    intelPrice: string;
    reinvestThreshold: number;
    reinvestPercentage: number;
}

export interface IntelReport {
    address: string;
    timestamp: string;

    // Raw data from PinionOS skills
    balances: { ETH: string; USDC: string };
    ethPriceUsd: string;

    // Synthesized intelligence (the value-add)
    portfolioValueUsd: string;
    riskScore: number;
    walletCategory: WalletCategory;
    portfolioHealth: PortfolioHealth;
    activityPattern: string;
    anomalies: string[];

    // AI analysis from skills.chat()
    aiSummary: string;
    recommendation: string;

    // Meta
    costToGenerate: string;
    skillsUsed: string[];
}

export type WalletCategory =
    | "whale"
    | "active-trader"
    | "hodler"
    | "new"
    | "dormant"
    | "degen";

export type PortfolioHealth =
    | "diversified"
    | "concentrated"
    | "underfunded"
    | "empty";

export interface AgentMetrics {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalRequests: number;
    totalSkillCalls: number;
    totalReinvestments: number;
    reinvestedAmount: number;
    currentEthBalance: string;
    currentUsdcBalance: string;
}

export interface Transaction {
    id: number;
    type: "revenue" | "expense" | "reinvestment";
    skill: string | null;
    amount: number;
    address: string | null;
    txHash: string | null;
    metadata: string | null;
    createdAt: string;
}

export interface Reinvestment {
    id: number;
    amount: number;
    txHash: string;
    createdAt: string;
}

export interface TimeSeriesPoint {
    timestamp: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface AgentEvent {
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
}

export interface Expense {
    skill: string;
    cost: number;
}
