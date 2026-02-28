// GET /api/events — Server-Sent Events (SSE) endpoint for real-time dashboard updates
// Events flow: Agent → EventBus → SSE → Dashboard
import { NextResponse } from "next/server";
import { getMetrics, getRecentTransactions, getAgentState } from "@/db/index";

export const dynamic = "force-dynamic";

export async function GET() {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Send initial state
            const sendEvent = (event: string, data: unknown) => {
                controller.enqueue(
                    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
                );
            };

            // Send current state immediately
            try {
                const metrics = getMetrics();
                const status = getAgentState("status") || "unknown";
                sendEvent("metrics", { ...metrics, agentStatus: status });

                const transactions = getRecentTransactions(20);
                sendEvent("transactions", transactions);
            } catch {
                // DB not ready yet
            }

            // Poll for updates every 2 seconds and push via SSE
            const interval = setInterval(() => {
                try {
                    const metrics = getMetrics();
                    const status = getAgentState("status") || "unknown";
                    sendEvent("metrics", { ...metrics, agentStatus: status });

                    const transactions = getRecentTransactions(20);
                    sendEvent("transactions", transactions);
                } catch {
                    // Ignore errors during polling
                }
            }, 2000);

            // Clean up on close
            const cleanup = () => {
                clearInterval(interval);
                try { controller.close(); } catch { /* already closed */ }
            };

            // Set a max lifetime of 30 seconds to prevent stale connections
            setTimeout(cleanup, 30_000);
        },
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}
