// Utility functions for Autonome

/**
 * Load agent configuration from environment variables.
 */
export function loadConfig() {
    const privateKey = process.env.PINION_PRIVATE_KEY;
    const walletAddress = process.env.AGENT_WALLET_ADDRESS;

    if (!privateKey) {
        throw new Error(
            "PINION_PRIVATE_KEY is required. Set it in .env.local or export it."
        );
    }
    if (!walletAddress) {
        throw new Error(
            "AGENT_WALLET_ADDRESS is required. Set it in .env.local or export it."
        );
    }

    return {
        privateKey,
        walletAddress,
        network: (process.env.PINION_NETWORK || "base-sepolia") as
            | "base"
            | "base-sepolia",
        skillServerPort: parseInt(process.env.SKILL_SERVER_PORT || "4020", 10),
        intelPrice: process.env.INTEL_PRICE || "$0.08",
        reinvestThreshold: parseFloat(process.env.REINVEST_THRESHOLD || "0.50"),
        reinvestPercentage: parseFloat(process.env.REINVEST_PERCENTAGE || "0.80"),
    };
}

/**
 * Format a number as USD currency string.
 */
export function formatUsd(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

/**
 * Truncate an ethereum address for display.
 */
export function truncateAddress(address: string): string {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sleep for a given number of milliseconds.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get current ISO timestamp.
 */
export function now(): string {
    return new Date().toISOString();
}

/**
 * Safely parse a numeric string, returning 0 on failure.
 */
export function safeParseFloat(value: string | undefined | null): number {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}
