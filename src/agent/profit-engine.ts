// Profit Engine — tracks revenue/expenses and triggers autonomous reinvestment
// This is what makes Autonome SELF-SUSTAINING

import type { PinionClient } from "pinion-os";
import { eventBus } from "./event-bus";
import {
    getMetrics,
    recordExpense,
    recordReinvestment,
    setAgentState,
} from "../db/index";
import type { AgentConfig, AgentMetrics } from "./types";

export class ProfitEngine {
    private config: AgentConfig;
    private pinion: PinionClient;
    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private isReinvesting = false;

    constructor(config: AgentConfig, pinion: PinionClient) {
        this.config = config;
        this.pinion = pinion;
    }

    /**
     * Start the profit monitoring loop.
     * Checks every 30 seconds if accumulated profit exceeds the reinvestment threshold.
     */
    start(): void {
        console.log(
            `📊 Profit engine started (threshold: $${this.config.reinvestThreshold}, reinvest: ${this.config.reinvestPercentage * 100}%)`
        );

        eventBus.emit("profit-engine:started", {
            threshold: this.config.reinvestThreshold,
            percentage: this.config.reinvestPercentage,
        });

        // Check immediately, then every 30 seconds
        this.checkAndReinvest();
        this.checkInterval = setInterval(() => this.checkAndReinvest(), 30_000);
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        eventBus.emit("profit-engine:stopped", {});
        console.log("📊 Profit engine stopped");
    }

    /**
     * Check if profit exceeds threshold and trigger reinvestment.
     */
    async checkAndReinvest(): Promise<void> {
        if (this.isReinvesting) return; // prevent concurrent reinvestments

        const metrics = getMetrics();
        const unreinvestedProfit =
            metrics.totalProfit - metrics.reinvestedAmount;

        eventBus.emit("profit-engine:check", {
            totalProfit: metrics.totalProfit.toFixed(4),
            reinvested: metrics.reinvestedAmount.toFixed(4),
            unreinvested: unreinvestedProfit.toFixed(4),
            threshold: this.config.reinvestThreshold,
            willReinvest: unreinvestedProfit >= this.config.reinvestThreshold,
        });

        if (unreinvestedProfit >= this.config.reinvestThreshold) {
            await this.executeReinvestment(unreinvestedProfit);
        }
    }

    /**
     * Execute the reinvestment: trade accumulated USDC profit into ETH on Base.
     */
    private async executeReinvestment(profit: number): Promise<void> {
        this.isReinvesting = true;
        const reinvestAmount = (profit * this.config.reinvestPercentage).toFixed(2);

        console.log(`🚀 Reinvesting $${reinvestAmount} USDC → ETH`);
        eventBus.emit("reinvest:starting", {
            amount: reinvestAmount,
            source: "USDC",
            target: "ETH",
        });

        try {
            // Step 1: Get trade quote via PinionOS
            eventBus.emit("skill:calling", {
                skill: "trade",
                detail: `$${reinvestAmount} USDC → ETH`,
            });
            const tradeResult = await this.pinion.skills.trade(
                "USDC",
                "ETH",
                reinvestAmount
            );
            const tradeData = tradeResult.data as any;
            recordExpense("trade", 0.01);
            eventBus.emit("skill:completed", { skill: "trade", cost: 0.01 });

            if (!tradeData?.swap) {
                throw new Error("Trade skill returned no swap data");
            }

            // Step 2: Handle approve tx if needed (for USDC allowance)
            if (tradeData.approve) {
                eventBus.emit("skill:calling", {
                    skill: "broadcast",
                    detail: "approve USDC spending",
                });
                await this.pinion.skills.broadcast(tradeData.approve);
                recordExpense("broadcast", 0.01);
                eventBus.emit("skill:completed", {
                    skill: "broadcast (approve)",
                    cost: 0.01,
                });
            }

            // Step 3: Broadcast the actual swap transaction
            eventBus.emit("skill:calling", {
                skill: "broadcast",
                detail: "execute USDC→ETH swap",
            });
            const broadcastResult = await this.pinion.skills.broadcast(
                tradeData.swap
            );
            recordExpense("broadcast", 0.01);
            eventBus.emit("skill:completed", { skill: "broadcast", cost: 0.01 });

            const broadcastData = broadcastResult.data as any;
            const txHash = broadcastData?.hash || "unknown";

            // Step 4: Record the reinvestment in DB
            recordReinvestment(parseFloat(reinvestAmount), txHash);

            console.log(`✅ Reinvestment complete! Tx: ${txHash}`);
            eventBus.emit("reinvest:completed", {
                amount: reinvestAmount,
                txHash,
                asset: "ETH",
            });

            // Step 5: Update wallet balance in DB
            await this.updateWalletBalance();
        } catch (error: any) {
            console.error(`❌ Reinvestment failed: ${error.message}`);
            eventBus.emit("reinvest:failed", { error: error.message });
        } finally {
            this.isReinvesting = false;
        }
    }

    /**
     * Update the agent's wallet balance in the database (for dashboard display).
     */
    async updateWalletBalance(): Promise<void> {
        try {
            const balResult = await this.pinion.skills.balance(
                this.config.walletAddress
            );
            recordExpense("balance", 0.01);

            const balData = balResult.data as any;
            const eth = balData?.balances?.ETH || "0";
            const usdc = balData?.balances?.USDC || "0";

            setAgentState("eth_balance", eth);
            setAgentState("usdc_balance", usdc);

            eventBus.emit("balance:updated", { eth, usdc });
        } catch (err: any) {
            console.error(`Failed to update balance: ${err.message}`);
        }
    }

    /**
     * Get current metrics for display.
     */
    getCurrentMetrics(): AgentMetrics {
        return getMetrics();
    }
}
