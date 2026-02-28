"use client";

import Header from "./Header";
import MetricsPanel from "./MetricsPanel";
import ProfitChart from "./ProfitChart";
import WalletStatus from "./WalletStatus";
import ActivityFeed from "./ActivityFeed";
import ReinvestLog from "./ReinvestLog";
import AgentControls from "./AgentControls";

interface Metrics {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalRequests: number;
    totalSkillCalls: number;
    totalReinvestments: number;
    reinvestedAmount: number;
    currentEthBalance: string;
    currentUsdcBalance: string;
}

interface Transaction {
    id: number;
    type: "revenue" | "expense" | "reinvestment";
    skill: string | null;
    amount: number;
    address: string | null;
    tx_hash: string | null;
    created_at: string;
}

interface TimeSeriesPoint {
    timestamp: string;
    revenue: number;
    expenses: number;
    profit: number;
}

interface DashboardProps {
    metrics: Metrics | null;
    transactions: Transaction[];
    timeSeries: TimeSeriesPoint[];
    agentStatus: string;
    lastUpdate: string;
    onRefresh: () => void;
}

export default function Dashboard({
    metrics,
    transactions,
    timeSeries,
    agentStatus,
    lastUpdate,
    onRefresh,
}: DashboardProps) {
    const networkUrl =
        metrics?.currentEthBalance !== undefined
            ? "https://sepolia.basescan.org"
            : "https://basescan.org";

    return (
        <div className="dashboard">
            {/* ── HEADER ──────────────────────────────── */}
            <Header agentStatus={agentStatus} lastUpdate={lastUpdate} />

            {/* ── AGENT CONTROLS ──────────────────────── */}
            <AgentControls agentStatus={agentStatus} onRefresh={onRefresh} />

            {/* ── METRICS CARDS ───────────────────────── */}
            <MetricsPanel
                totalRevenue={metrics?.totalRevenue ?? 0}
                totalExpenses={metrics?.totalExpenses ?? 0}
                totalProfit={metrics?.totalProfit ?? 0}
                totalRequests={metrics?.totalRequests ?? 0}
                totalSkillCalls={metrics?.totalSkillCalls ?? 0}
            />

            {/* ── CHART + WALLET ──────────────────────── */}
            <div className="secondary-grid">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">📊 Profit Over Time</span>
                        <span className="card-badge live">● LIVE</span>
                    </div>
                    <div className="card-body">
                        <ProfitChart data={timeSeries} />
                    </div>
                </div>

                <WalletStatus
                    ethBalance={metrics?.currentEthBalance || "0"}
                    usdcBalance={metrics?.currentUsdcBalance || "0"}
                    totalProfit={metrics?.totalProfit ?? 0}
                    reinvestedAmount={metrics?.reinvestedAmount ?? 0}
                    totalReinvestments={metrics?.totalReinvestments ?? 0}
                    reinvestThreshold={0.5}
                    totalExpenses={metrics?.totalExpenses ?? 0}
                />
            </div>

            {/* ── ACTIVITY FEED ───────────────────────── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <span className="card-title">📡 Live Activity Feed</span>
                    <span className="card-badge live">● STREAMING</span>
                </div>
                <ActivityFeed transactions={transactions} networkUrl={networkUrl} />
            </div>

            {/* ── REINVESTMENT HISTORY ─────────────────── */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">🚀 Reinvestment History</span>
                </div>
                <ReinvestLog transactions={transactions} networkUrl={networkUrl} />
            </div>
        </div>
    );
}
