// AgentCore — the heart of Autonome
// Orchestrates: skill server (earning) + PinionClient (spending) + profit engine (reinvesting)

import { PinionClient } from "pinion-os";
import { eventBus } from "./event-bus";
import { ProfitEngine } from "./profit-engine";
import { startSkillServer } from "./skill-server";
import { setAgentState, getDb } from "../db/index";
import { loadConfig } from "../lib/utils";
import type { AgentConfig } from "./types";
import dotenv from "dotenv";
import path from "path";

// Load .env.local first (Next.js convention), then .env as fallback
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ═══════════════════════════════════════════════════════════════════════
// AGENT CORE CLASS
// ═══════════════════════════════════════════════════════════════════════

class AgentCore {
    private config: AgentConfig;
    private pinion: PinionClient;
    private profitEngine: ProfitEngine;
    private isRunning: boolean = false;

    constructor(config: AgentConfig) {
        this.config = config;

        // Initialize PinionClient — this is how the agent SPENDS on skills
        this.pinion = new PinionClient({
            privateKey: config.privateKey,
            network: config.network,
        });

        // Initialize profit engine — this tracks revenue/expenses and triggers reinvestment
        this.profitEngine = new ProfitEngine(config, this.pinion);
    }

    /**
     * Start the autonomous agent.
     */
    async start(): Promise<void> {
        console.log("═══════════════════════════════════════════════════");
        console.log("  ⚡ AUTONOME — Self-Operating Software Agent");
        console.log("═══════════════════════════════════════════════════");
        console.log(`  Wallet:  ${this.config.walletAddress}`);
        console.log(`  Network: ${this.config.network}`);
        console.log(`  Intel price: ${this.config.intelPrice}`);
        console.log(`  Reinvest threshold: $${this.config.reinvestThreshold}`);
        console.log("═══════════════════════════════════════════════════\n");

        // Initialize DB
        getDb();
        setAgentState("status", "starting");
        setAgentState("started_at", new Date().toISOString());

        // Step 1: Check wallet balance
        console.log("🔍 Checking wallet balance...");
        try {
            await this.profitEngine.updateWalletBalance();
            console.log("✅ Wallet balance retrieved\n");
        } catch (err: any) {
            console.warn(`⚠️  Could not check balance: ${err.message}\n`);
        }

        // Step 2: Start the x402 skill server (earning)
        console.log("🚀 Starting skill server...");
        await startSkillServer(this.config, this.pinion);

        // Step 3: Start the profit engine (monitoring + reinvesting)
        this.profitEngine.start();

        // Update agent state
        this.isRunning = true;
        setAgentState("status", "running");
        eventBus.emit("agent:started", {
            wallet: this.config.walletAddress,
            network: this.config.network,
        });

        console.log("═══════════════════════════════════════════════════");
        console.log("  ✅ AUTONOME IS LIVE AND AUTONOMOUS");
        console.log("  📊 Dashboard: http://localhost:3000");
        console.log(`  🔌 API: http://localhost:${this.config.skillServerPort}`);
        console.log("═══════════════════════════════════════════════════\n");
        console.log("Waiting for incoming intelligence requests...\n");
    }

    /**
     * Stop the autonomous agent gracefully.
     * Shuts down the profit engine and updates agent state.
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log("\n🛑 Stopping Autonome agent...");
        this.profitEngine.stop();
        this.isRunning = false;
        setAgentState("status", "stopped");
        setAgentState("stopped_at", new Date().toISOString());
        eventBus.emit("agent:stopped", {});
        console.log("✅ Agent stopped gracefully.");
    }
}

// ═══════════════════════════════════════════════════════════════════════
// ENTRY POINT — Run the agent
// ═══════════════════════════════════════════════════════════════════════

async function main() {
    try {
        const config = loadConfig();
        const agent = new AgentCore(config);
        await agent.start();

        // Graceful shutdown
        process.on("SIGINT", async () => {
            console.log("\n\n🛑 Shutting down Autonome...");
            await agent.stop();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            await agent.stop();
            process.exit(0);
        });
    } catch (error: any) {
        console.error(`\n❌ Failed to start Autonome: ${error.message}\n`);
        console.error(
            "Make sure PINION_PRIVATE_KEY and AGENT_WALLET_ADDRESS are set."
        );
        console.error("See .env.example for required configuration.\n");
        process.exit(1);
    }
}

main();
