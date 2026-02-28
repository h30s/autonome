// GET /api/agent/status — Returns current agent status
import { NextResponse } from "next/server";
import { getAgentState, getMetrics } from "@/db/index";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const status = getAgentState("status") || "unknown";
        const startedAt = getAgentState("started_at") || null;
        const ethBalance = getAgentState("eth_balance") || "0";
        const usdcBalance = getAgentState("usdc_balance") || "0";
        const metrics = getMetrics();

        return NextResponse.json({
            status,
            startedAt,
            wallet: {
                eth: ethBalance,
                usdc: usdcBalance,
            },
            metrics,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
