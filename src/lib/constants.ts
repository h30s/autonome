// Configuration constants for Autonome

export const DEFAULTS = {
    NETWORK: "base-sepolia" as const,
    SKILL_SERVER_PORT: 4020,
    INTEL_PRICE: "$0.08",
    REINVEST_THRESHOLD: 0.5,
    REINVEST_PERCENTAGE: 0.8,
    PROFIT_CHECK_INTERVAL_MS: 30_000,
    DB_PATH: "autonome.db",
} as const;

// Skill costs on PinionOS (x402)
export const SKILL_COSTS: Record<string, number> = {
    balance: 0.01,
    price: 0.01,
    tx: 0.01,
    fund: 0.01,
    chat: 0.01,
    trade: 0.01,
    broadcast: 0.01,
    wallet: 0.01,
    send: 0.01,
};

// Base network explorers
export const EXPLORER_URL: Record<string, string> = {
    base: "https://basescan.org",
    "base-sepolia": "https://sepolia.basescan.org",
};

export function getExplorerTxUrl(
    txHash: string,
    network: string = "base-sepolia"
): string {
    const base = EXPLORER_URL[network] || EXPLORER_URL["base-sepolia"];
    return `${base}/tx/${txHash}`;
}
