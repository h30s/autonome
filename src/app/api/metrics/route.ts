// GET /api/metrics — Returns current agent metrics
import { NextResponse } from "next/server";
import { getMetrics, getAgentState } from "@/db/index";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const metrics = getMetrics();
        const agentStatus = getAgentState("status") || "unknown";

        return NextResponse.json({
            ...metrics,
            agentStatus,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
