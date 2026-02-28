// Skill Server — the x402-paywalled API that earns USDC for Autonome
// Uses PinionOS's createSkillServer framework

import type { PinionClient } from "pinion-os";
import { eventBus } from "./event-bus";
import { recordRevenue, recordExpense } from "../db/index";
import { generateIntelReport } from "./intelligence";
import type { AgentConfig } from "./types";

/**
 * Create and start the x402 skill server.
 * This is how Autonome EARNS — callers pay USDC to get intelligence reports.
 */
export async function startSkillServer(
    config: AgentConfig,
    pinion: PinionClient
): Promise<void> {
    // Dynamic import to handle ESM/CJS compatibility
    const { createSkillServer, skill } = await import("pinion-os/server");

    const server = createSkillServer({
        payTo: config.walletAddress,
        network: config.network,
        port: config.skillServerPort,
    });

    // ── PAID SKILL: Wallet Intelligence Report ($0.08 per call) ───────
    server.add(
        skill("intel", {
            description:
                "AI-powered on-chain wallet intelligence report with risk scoring, behavioral categorization, portfolio analysis, and actionable recommendations. Powered by PinionOS skills.",
            endpoint: "/intel/:address",
            method: "GET",
            price: config.intelPrice,
            handler: async (req: any, res: any) => {
                const address = req.params.address as string;

                try {
                    // Validate Ethereum address
                    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
                        res.status(400).json({ error: "Invalid Ethereum address" });
                        return;
                    }

                    console.log(`\n📥 Intel request for ${address}`);
                    eventBus.emit("intel:request", { address });

                    // Generate the intelligence report (calls PinionOS skills internally)
                    const report = await generateIntelReport(pinion, address);

                    // Record the revenue
                    const price = parseFloat(config.intelPrice.replace("$", ""));
                    recordRevenue(price, address);

                    // Calculate profit for this request  
                    const cost = parseFloat(report.costToGenerate);
                    const profit = price - cost;

                    console.log(
                        `✅ Intel complete: revenue=$${price.toFixed(2)}, cost=$${cost.toFixed(2)}, profit=$${profit.toFixed(2)}`
                    );

                    eventBus.emit("intel:completed", {
                        address,
                        revenue: price.toFixed(2),
                        cost: cost.toFixed(2),
                        profit: profit.toFixed(2),
                    });

                    res.json({
                        status: "success",
                        report,
                        meta: {
                            poweredBy: "Autonome × PinionOS",
                            skillsUsed: report.skillsUsed,
                            costToGenerate: report.costToGenerate,
                        },
                    });
                } catch (error: any) {
                    console.error(`❌ Intel error: ${error.message}`);
                    eventBus.emit("intel:failed", {
                        address,
                        error: error.message,
                    });
                    res.status(500).json({
                        error: "Failed to generate intelligence report",
                        details: error.message,
                    });
                }
            },
        })
    );

    // ── PAID SKILL: Quick Balance Check ($0.02) ───────────────────────
    server.add(
        skill("quick-check", {
            description:
                "Quick wallet health check with risk score. Faster and cheaper than full intel report.",
            endpoint: "/check/:address",
            method: "GET",
            price: "$0.02",
            handler: async (req: any, res: any) => {
                const address = req.params.address as string;

                try {
                    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
                        res.status(400).json({ error: "Invalid Ethereum address" });
                        return;
                    }

                    eventBus.emit("intel:request", { address, type: "quick-check" });

                    // Just balance + price (no AI analysis)
                    const balResult = await pinion.skills.balance(address);
                    recordExpense("balance", 0.01);
                    eventBus.emit("skill:completed", { skill: "balance", cost: 0.01 });

                    const balData = balResult.data as any;
                    const balances = balData?.balances || {
                        ETH: "0",
                        USDC: "0",
                    };
                    const ethBal = parseFloat(balances.ETH || "0");
                    const usdcBal = parseFloat(balances.USDC || "0");

                    // Simple risk score based on balance
                    let risk = 50;
                    if (ethBal + usdcBal < 1) risk = 85;
                    else if (ethBal + usdcBal > 1000) risk = 25;

                    recordRevenue(0.02, address);
                    eventBus.emit("intel:completed", {
                        address,
                        revenue: "0.02",
                        cost: "0.01",
                        profit: "0.01",
                        type: "quick-check",
                    });

                    res.json({
                        address,
                        balances,
                        riskScore: risk,
                        health: ethBal === 0 && usdcBal === 0 ? "empty" : "active",
                    });
                } catch (error: any) {
                    res.status(500).json({ error: error.message });
                }
            },
        })
    );

    // Start listening
    server.listen(config.skillServerPort);

    console.log(`\n⚡ Autonome skill server running on port ${config.skillServerPort}`);
    console.log(`   💰 /intel/:address — Full intelligence report (${config.intelPrice})`);
    console.log(`   ⚡ /check/:address — Quick health check ($0.02)`);
    console.log(`   📋 /catalog — Skill discovery (free)`);
    console.log(`   💳 All payments via x402 on ${config.network}\n`);

    eventBus.emit("server:started", {
        port: config.skillServerPort,
        skills: ["intel", "quick-check"],
    });
}
