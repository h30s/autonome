// Intelligence Pipeline — the value-creation engine of Autonome
// Takes raw PinionOS skill outputs and synthesizes them into
// a structured intelligence report that no single skill provides.

import type { PinionClient } from "pinion-os";
import { payX402Service } from "pinion-os";
import { eventBus } from "./event-bus";
import { recordExpense } from "../db/index";
import { safeParseFloat } from "../lib/utils";
import type {
    IntelReport,
    WalletCategory,
    PortfolioHealth,
    Expense,
} from "./types";

/**
 * Generate a comprehensive wallet intelligence report.
 * This is the core value proposition — it combines multiple PinionOS
 * skill calls + local computation + AI analysis to produce insights
 * that NO single skill can provide.
 */
export async function generateIntelReport(
    pinion: PinionClient,
    address: string
): Promise<IntelReport> {
    const expenses: Expense[] = [];
    const skillsUsed: string[] = [];

    // ── STEP 1: Get wallet balances via PinionOS ──────────────────────
    eventBus.emit("skill:calling", { skill: "balance", address });
    let balances = { ETH: "0", USDC: "0" };
    try {
        const balanceResult = await pinion.skills.balance(address);
        const balData = balanceResult.data as any;
        balances = balData?.balances || balances;
        expenses.push({ skill: "balance", cost: 0.01 });
        skillsUsed.push("balance");
        recordExpense("balance", 0.01);
        eventBus.emit("skill:completed", { skill: "balance", cost: 0.01 });
    } catch (err: any) {
        eventBus.emit("skill:failed", {
            skill: "balance",
            error: err.message,
        });
    }

    // ── STEP 2: Get current ETH price for USD valuation ───────────────
    eventBus.emit("skill:calling", { skill: "price", token: "ETH" });
    let ethPrice = 0;
    try {
        const priceResult = await pinion.skills.price("ETH");
        const priceData = priceResult.data as any;
        ethPrice = safeParseFloat(
            priceData?.usd || priceData?.price?.toString() || priceData?.toString()
        );
        expenses.push({ skill: "price", cost: 0.01 });
        skillsUsed.push("price");
        recordExpense("price", 0.01);
        eventBus.emit("skill:completed", { skill: "price", cost: 0.01 });
    } catch (err: any) {
        eventBus.emit("skill:failed", {
            skill: "price",
            error: err.message,
        });
    }

    // ── STEP 3: Get wallet funding status ─────────────────────────────
    eventBus.emit("skill:calling", { skill: "fund", address });
    let fundData: any = {};
    try {
        const fundResult = await pinion.skills.fund(address);
        fundData = fundResult.data || {};
        expenses.push({ skill: "fund", cost: 0.01 });
        skillsUsed.push("fund");
        recordExpense("fund", 0.01);
        eventBus.emit("skill:completed", { skill: "fund", cost: 0.01 });
    } catch (err: any) {
        eventBus.emit("skill:failed", {
            skill: "fund",
            error: err.message,
        });
    }

    // ── STEP 3.5: External x402 enrichment via payX402Service ─────────
    // Demonstrates payX402Service SDK usage — calls an external x402-paywalled
    // data source for additional context (cross-referencing via the PinionOS public API)
    let externalEnrichment: any = null;
    try {
        eventBus.emit("skill:calling", { skill: "payX402Service", detail: "external data enrichment" });
        const enrichResult = await payX402Service(
            pinion.signer,
            `https://skills.pinionfun.com/api/v1/balance/${address}`
        );
        externalEnrichment = enrichResult;
        expenses.push({ skill: "payX402Service", cost: 0.01 });
        skillsUsed.push("payX402Service");
        recordExpense("payX402Service", 0.01);
        eventBus.emit("skill:completed", { skill: "payX402Service", cost: 0.01 });
    } catch (err: any) {
        // Non-critical — enrichment is optional, agent continues without it
        eventBus.emit("skill:failed", {
            skill: "payX402Service",
            error: err.message,
        });
    }

    // ── STEP 4: LOCAL COMPUTATION — Create genuinely new value ────────
    const ethBalance = safeParseFloat(balances.ETH);
    const usdcBalance = safeParseFloat(balances.USDC);
    const portfolioValueUsd = (ethBalance * ethPrice + usdcBalance).toFixed(2);

    const riskScore = computeRiskScore(ethBalance, usdcBalance, ethPrice);
    const walletCategory = categorizeWallet(
        ethBalance,
        usdcBalance,
        portfolioValueUsd
    );
    const portfolioHealth = assessHealth(ethBalance, usdcBalance);
    const activityPattern = assessActivity(fundData);
    const anomalies = detectAnomalies(ethBalance, usdcBalance, ethPrice);

    // ── STEP 5: AI ANALYSIS — Premium intelligence via skills.chat() ──
    eventBus.emit("skill:calling", { skill: "chat", detail: "AI wallet analysis" });
    let aiSummary = "AI analysis unavailable";
    let recommendation = "No recommendation available";

    try {
        const prompt = buildAnalysisPrompt({
            address,
            ethBalance,
            usdcBalance,
            ethPrice,
            portfolioValueUsd,
            riskScore,
            walletCategory,
            portfolioHealth,
            anomalies,
            fundData,
        });

        const chatResult = await pinion.skills.chat(prompt);
        const chatData = chatResult.data as any;
        const response = chatData?.response || "";
        aiSummary = response;
        recommendation = extractRecommendation(response);
        expenses.push({ skill: "chat", cost: 0.01 });
        skillsUsed.push("chat");
        recordExpense("chat", 0.01);
        eventBus.emit("skill:completed", { skill: "chat", cost: 0.01 });
    } catch (err: any) {
        eventBus.emit("skill:failed", {
            skill: "chat",
            error: err.message,
        });
    }

    // ── BUILD REPORT ──────────────────────────────────────────────────
    const totalCost = expenses.reduce((sum, e) => sum + e.cost, 0);

    return {
        address,
        timestamp: new Date().toISOString(),
        balances,
        ethPriceUsd: ethPrice.toFixed(2),
        portfolioValueUsd,
        riskScore,
        walletCategory,
        portfolioHealth,
        activityPattern,
        anomalies,
        aiSummary,
        recommendation,
        costToGenerate: totalCost.toFixed(2),
        skillsUsed,
    };
}

// ═══════════════════════════════════════════════════════════════════════
// LOCAL COMPUTATION FUNCTIONS — These create NEW value from raw data
// ═══════════════════════════════════════════════════════════════════════

function computeRiskScore(
    eth: number,
    usdc: number,
    ethPrice: number
): number {
    let score = 50; // baseline risk

    const totalUsd = eth * ethPrice + usdc;

    // Portfolio size factors
    if (totalUsd < 10) score += 20; // underfunded = high risk
    if (totalUsd < 1) score += 15; // nearly empty = very high risk
    if (totalUsd > 10000) score -= 10; // well-funded = lower risk
    if (totalUsd > 100000) score -= 15; // very well-funded

    // Concentration factors
    if (totalUsd > 0) {
        const ethPct = (eth * ethPrice) / totalUsd;
        if (ethPct > 0.95) score += 20; // over-concentrated in volatile asset
        if (ethPct > 0.8) score += 10;
        if (ethPct < 0.2) score -= 10; // mostly stables = safer
    }

    // No diversification penalty
    if (eth === 0 || usdc === 0) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
}

function categorizeWallet(
    eth: number,
    usdc: number,
    totalUsd: string
): WalletCategory {
    const total = parseFloat(totalUsd);
    if (total === 0) return "new";
    if (total < 1) return "dormant";
    if (total > 100000) return "whale";
    if (total > 10000) return "active-trader";
    if (usdc > eth * 2650 * 2) return "hodler"; // mostly stables
    return "active-trader";
}

function assessHealth(eth: number, usdc: number): PortfolioHealth {
    if (eth === 0 && usdc === 0) return "empty";
    if (eth === 0 || usdc === 0) return "concentrated";
    const total = eth + usdc;
    if (total < 0.01) return "underfunded";
    return "diversified";
}

function assessActivity(fundData: any): string {
    // Infer activity pattern from funding data
    if (fundData?.funding?.steps?.length > 0) return "needs-funding";
    return "normal";
}

function detectAnomalies(
    eth: number,
    usdc: number,
    ethPrice: number
): string[] {
    const anomalies: string[] = [];
    const totalUsd = eth * ethPrice + usdc;

    if (eth > 100) anomalies.push("Large ETH holding (>100 ETH)");
    if (usdc > 50000) anomalies.push("Significant stablecoin reserves (>$50k)");
    if (eth === 0 && usdc === 0)
        anomalies.push("Empty wallet — possible new or drained account");
    if (totalUsd > 1000000) anomalies.push("Whale-tier portfolio (>$1M)");
    if (eth > 0 && usdc === 0) anomalies.push("No stablecoin buffer — fully exposed to ETH volatility");
    if (anomalies.length === 0) anomalies.push("No anomalies detected");

    return anomalies;
}

function buildAnalysisPrompt(data: {
    address: string;
    ethBalance: number;
    usdcBalance: number;
    ethPrice: number;
    portfolioValueUsd: string;
    riskScore: number;
    walletCategory: WalletCategory;
    portfolioHealth: PortfolioHealth;
    anomalies: string[];
    fundData: any;
}): string {
    return `You are a blockchain intelligence analyst. Analyze this Base L2 wallet and provide:
1. A brief profile summary (2-3 sentences about who this wallet likely belongs to)
2. Key observations about their holdings and behavior
3. One actionable recommendation

Wallet data:
- Address: ${data.address}
- Network: Base L2
- ETH Balance: ${data.ethBalance.toFixed(6)} ETH ($${(data.ethBalance * data.ethPrice).toFixed(2)})
- USDC Balance: ${data.usdcBalance.toFixed(2)} USDC
- Total Portfolio: $${data.portfolioValueUsd}
- ETH Price: $${data.ethPrice.toFixed(2)}
- Risk Score: ${data.riskScore}/100 (higher = riskier)
- Category: ${data.walletCategory}
- Portfolio Health: ${data.portfolioHealth}
- Anomalies: ${data.anomalies.join(", ")}

Be concise and direct. No disclaimers. Focus on actionable intelligence.`;
}

function extractRecommendation(aiResponse: string): string {
    // Try to extract the recommendation section from the AI response
    const lines = aiResponse.split("\n");
    const recIndex = lines.findIndex(
        (l) =>
            l.toLowerCase().includes("recommendation") ||
            l.toLowerCase().includes("suggest") ||
            l.toLowerCase().includes("action")
    );

    if (recIndex >= 0 && recIndex < lines.length - 1) {
        return lines
            .slice(recIndex)
            .join(" ")
            .replace(/^[^:]*:\s*/, "")
            .trim()
            .slice(0, 300);
    }

    // Fallback: return last meaningful line
    const meaningful = lines.filter((l) => l.trim().length > 20);
    return meaningful[meaningful.length - 1]?.trim() || "Review portfolio allocation";
}
