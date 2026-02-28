// POST /api/intel — Trigger a manual intelligence report (for demo purposes)
// This simulates a skill server request by calling the intelligence pipeline directly
import { NextResponse } from "next/server";
import { PinionClient } from "pinion-os";
import { generateIntelReport } from "@/agent/intelligence";
import { recordRevenue } from "@/db/index";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const address = body.address as string;

        if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
            return NextResponse.json(
                { error: "Invalid Ethereum address. Must be 0x followed by 40 hex characters." },
                { status: 400 }
            );
        }

        const privateKey = process.env.PINION_PRIVATE_KEY;
        if (!privateKey) {
            return NextResponse.json(
                { error: "Agent not configured — PINION_PRIVATE_KEY is missing" },
                { status: 503 }
            );
        }

        const pinion = new PinionClient({
            privateKey,
            network: (process.env.PINION_NETWORK || "base-sepolia") as "base" | "base-sepolia",
        });

        const report = await generateIntelReport(pinion, address);

        // Record demo revenue
        recordRevenue(0.08, address);

        return NextResponse.json({
            status: "success",
            report,
            meta: {
                poweredBy: "Autonome × PinionOS",
                skillsUsed: report.skillsUsed,
                costToGenerate: report.costToGenerate,
                triggeredFrom: "dashboard-demo",
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
