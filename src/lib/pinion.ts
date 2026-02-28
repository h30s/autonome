// PinionClient singleton — shared across the agent
// Ensures a single PinionClient instance is reused

import { PinionClient } from "pinion-os";

let pinionInstance: PinionClient | null = null;

/**
 * Get or create the shared PinionClient singleton.
 * Requires PINION_PRIVATE_KEY and PINION_NETWORK env vars.
 */
export function getPinionClient(): PinionClient {
    if (!pinionInstance) {
        const privateKey = process.env.PINION_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error(
                "PINION_PRIVATE_KEY is required. Set it in .env.local"
            );
        }

        pinionInstance = new PinionClient({
            privateKey,
            network: (process.env.PINION_NETWORK || "base-sepolia") as
                | "base"
                | "base-sepolia",
        });
    }
    return pinionInstance;
}

/**
 * Reset the singleton (useful for testing or reconfiguration).
 */
export function resetPinionClient(): void {
    pinionInstance = null;
}
