// POST /api/agent/stop — Stop the agent (set status to stopped)
import { NextResponse } from "next/server";
import { setAgentState } from "@/db/index";

export const dynamic = "force-dynamic";

export async function POST() {
    try {
        setAgentState("status", "stopped");

        return NextResponse.json({
            status: "stopped",
            message: "Agent status set to stopped.",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
