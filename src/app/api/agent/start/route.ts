// POST /api/agent/start — Start the agent (set status to running)
import { NextResponse } from "next/server";
import { setAgentState } from "@/db/index";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        setAgentState("status", "running");
        setAgentState("started_at", new Date().toISOString());

        return NextResponse.json({
            status: "running",
            message: "Agent started. The backend agent process should be running via `npm run agent`.",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
