"use client";

import { useState } from "react";

interface AgentControlsProps {
    agentStatus: string;
    onRefresh: () => void;
}

export default function AgentControls({ agentStatus, onRefresh }: AgentControlsProps) {
    const [loading, setLoading] = useState(false);
    const [intelAddress, setIntelAddress] = useState("");
    const [intelResult, setIntelResult] = useState<string | null>(null);

    const handleStart = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/agent/start", { method: "POST" });
            if (res.ok) {
                onRefresh();
            }
        } catch {
            console.error("Failed to start agent");
        } finally {
            setLoading(false);
        }
    };

    const handleStop = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/agent/stop", { method: "POST" });
            if (res.ok) {
                onRefresh();
            }
        } catch {
            console.error("Failed to stop agent");
        } finally {
            setLoading(false);
        }
    };

    const handleIntelDemo = async () => {
        if (!intelAddress || !/^0x[0-9a-fA-F]{40}$/.test(intelAddress)) {
            setIntelResult("Please enter a valid Ethereum address (0x...)");
            return;
        }
        setLoading(true);
        setIntelResult(null);
        try {
            const res = await fetch("/api/intel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ address: intelAddress }),
            });
            const data = await res.json();
            if (res.ok) {
                setIntelResult(`✅ Intel report generated! Risk: ${data.report?.riskScore ?? "N/A"}/100, Category: ${data.report?.walletCategory ?? "N/A"}`);
                onRefresh();
            } else {
                setIntelResult(`❌ ${data.error || "Failed"}`);
            }
        } catch (err: any) {
            setIntelResult(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isRunning = agentStatus === "running";

    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
                <span className="card-title">🎛️ Agent Controls</span>
                <span className={`card-badge ${isRunning ? "live" : ""}`}>
                    {isRunning ? "● RUNNING" : "○ STOPPED"}
                </span>
            </div>
            <div className="card-body">
                <div className="controls-row">
                    <button
                        className={`control-btn ${isRunning ? "stop" : "start"}`}
                        onClick={isRunning ? handleStop : handleStart}
                        disabled={loading}
                    >
                        {loading ? "..." : isRunning ? "⏹ Stop Agent" : "▶ Start Agent"}
                    </button>
                    <button
                        className="control-btn refresh"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Demo Intel Trigger */}
                <div className="intel-demo" style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                        Demo: Trigger an intelligence report manually
                    </div>
                    <div className="controls-row">
                        <input
                            type="text"
                            className="intel-input"
                            placeholder="0x... Ethereum address"
                            value={intelAddress}
                            onChange={(e) => setIntelAddress(e.target.value)}
                        />
                        <button
                            className="control-btn intel"
                            onClick={handleIntelDemo}
                            disabled={loading}
                        >
                            🧠 Run Intel
                        </button>
                    </div>
                    {intelResult && (
                        <div style={{
                            marginTop: 8,
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            color: intelResult.startsWith("✅") ? "var(--green)" : "var(--red)",
                        }}>
                            {intelResult}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
