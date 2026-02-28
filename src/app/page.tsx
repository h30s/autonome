"use client";

import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
    const [agentStatus, setAgentStatus] = useState<string>("unknown");
    const [lastUpdate, setLastUpdate] = useState<string>("");

    const fetchData = useCallback(async () => {
        try {
            const [metricsRes, txRes, tsRes] = await Promise.all([
                fetch("/api/metrics"),
                fetch("/api/transactions"),
                fetch("/api/timeseries"),
            ]);

            if (metricsRes.ok) {
                const m = await metricsRes.json();
                setMetrics(m);
                setAgentStatus(m.agentStatus || "running");
            }
            if (txRes.ok) setTransactions(await txRes.json());
            if (tsRes.ok) setTimeSeries(await tsRes.json());
            setLastUpdate(new Date().toLocaleTimeString());
        } catch {
            setAgentStatus("offline");
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, [fetchData]);

    const networkUrl =
        metrics?.currentEthBalance !== undefined
            ? "https://sepolia.basescan.org"
            : "https://basescan.org";

    return (
        <div className="dashboard">
            {/* ── HEADER ──────────────────────────────────────────────── */}
            <header className="header">
                <div className="header-brand">
                    <div>
                        <div className="header-logo">
                            ⚡ <span>AUTO</span>NOME
                        </div>
                        <div className="header-tagline">
                            Self-Operating AI Agent • Powered by PinionOS
                        </div>
                    </div>
                </div>
                <div className="header-status">
                    <div className={`status-badge ${agentStatus === "running" ? "running" : "stopped"}`}>
                        <div className={`status-dot ${agentStatus === "running" ? "running" : "stopped"}`} />
                        {agentStatus === "running" ? "AGENT LIVE" : agentStatus.toUpperCase()}
                    </div>
                    <div className="wallet-address">
                        Updated: {lastUpdate || "—"}
                    </div>
                </div>
            </header>

            {/* ── METRICS CARDS ──────────────────────────────────────── */}
            <div className="metrics-grid">
                <MetricCard
                    label="💰 Revenue"
                    value={metrics?.totalRevenue ?? 0}
                    color="green"
                    sub={`${metrics?.totalRequests ?? 0} requests served`}
                    className="revenue"
                />
                <MetricCard
                    label="💸 Expenses"
                    value={metrics?.totalExpenses ?? 0}
                    color="red"
                    sub={`${metrics?.totalSkillCalls ?? 0} skill calls made`}
                    className="expenses"
                />
                <MetricCard
                    label="📈 Net Profit"
                    value={metrics?.totalProfit ?? 0}
                    color="gold"
                    sub={
                        metrics && metrics.totalRevenue > 0
                            ? `${((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(0)}% margin`
                            : "Awaiting first request"
                    }
                    className="profit"
                />
            </div>

            {/* ── CHART + WALLET ─────────────────────────────────────── */}
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

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">🏦 Agent Wallet</span>
                    </div>
                    <div className="card-body">
                        <div className="wallet-item">
                            <span className="wallet-token">ETH</span>
                            <span className="wallet-amount">
                                {parseFloat(metrics?.currentEthBalance || "0").toFixed(6)}
                            </span>
                        </div>
                        <div className="wallet-item">
                            <span className="wallet-token">USDC</span>
                            <span className="wallet-amount">
                                {parseFloat(metrics?.currentUsdcBalance || "0").toFixed(2)}
                            </span>
                        </div>

                        <ReinvestProgress
                            profit={metrics?.totalProfit ?? 0}
                            reinvested={metrics?.reinvestedAmount ?? 0}
                            threshold={0.5}
                        />

                        {(metrics?.totalReinvestments ?? 0) > 0 && (
                            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                                🚀 {metrics!.totalReinvestments} reinvestment(s) •
                                ${metrics!.reinvestedAmount.toFixed(2)} total
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── ACTIVITY FEED ──────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <span className="card-title">📡 Live Activity Feed</span>
                    <span className="card-badge live">● STREAMING</span>
                </div>
                <ActivityFeed transactions={transactions} networkUrl={networkUrl} />
            </div>

            {/* ── REINVESTMENT HISTORY ────────────────────────────────── */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">🚀 Reinvestment History</span>
                </div>
                <ReinvestmentTable
                    transactions={transactions.filter((t) => t.type === "reinvestment")}
                    networkUrl={networkUrl}
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function MetricCard({
    label,
    value,
    color,
    sub,
    className,
}: {
    label: string;
    value: number;
    color: string;
    sub: string;
    className: string;
}) {
    return (
        <div className={`metric-card ${className}`}>
            <div className="metric-label">{label}</div>
            <div className={`metric-value ${color}`}>${value.toFixed(4)}</div>
            <div className="metric-sub">{sub}</div>
        </div>
    );
}

function ProfitChart({ data }: { data: TimeSeriesPoint[] }) {
    if (data.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">
                    Chart will populate as the agent processes requests
                </div>
            </div>
        );
    }

    // Simple SVG chart — no external dependency needed for the chart
    const width = 700;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(
        ...data.map((d) => Math.max(d.revenue, d.expenses, d.profit)),
        0.01
    );

    const xScale = (i: number) =>
        padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const yScale = (v: number) =>
        padding.top + chartH - (v / maxVal) * chartH;

    const linePath = (key: keyof TimeSeriesPoint) =>
        data
            .map(
                (d, i) =>
                    `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d[key] as number)}`
            )
            .join(" ");

    const areaPath = (key: keyof TimeSeriesPoint) =>
        linePath(key) +
        ` L ${xScale(data.length - 1)} ${yScale(0)} L ${xScale(0)} ${yScale(0)} Z`;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "100%" }}
        >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                <line
                    key={pct}
                    x1={padding.left}
                    y1={yScale(maxVal * pct)}
                    x2={width - padding.right}
                    y2={yScale(maxVal * pct)}
                    stroke="var(--border)"
                    strokeWidth="1"
                />
            ))}

            {/* Profit area fill */}
            <path d={areaPath("profit")} fill="rgba(0, 255, 136, 0.06)" />

            {/* Lines */}
            <path
                d={linePath("revenue")}
                fill="none"
                stroke="var(--green)"
                strokeWidth="2"
            />
            <path
                d={linePath("expenses")}
                fill="none"
                stroke="var(--red)"
                strokeWidth="2"
                strokeDasharray="4,4"
            />
            <path
                d={linePath("profit")}
                fill="none"
                stroke="var(--gold)"
                strokeWidth="2.5"
            />

            {/* Labels */}
            <text x={width - 60} y={yScale(data[data.length - 1]?.revenue || 0) - 6} fill="var(--green)" fontSize="11" fontFamily="var(--font-mono)">
                Revenue
            </text>
            <text x={width - 65} y={yScale(data[data.length - 1]?.expenses || 0) + 14} fill="var(--red)" fontSize="11" fontFamily="var(--font-mono)">
                Expenses
            </text>
            <text x={width - 48} y={yScale(data[data.length - 1]?.profit || 0) - 6} fill="var(--gold)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">
                Profit
            </text>

            {/* Y-axis labels */}
            {[0, 0.5, 1].map((pct) => (
                <text
                    key={pct}
                    x={padding.left - 6}
                    y={yScale(maxVal * pct) + 4}
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    textAnchor="end"
                >
                    ${(maxVal * pct).toFixed(2)}
                </text>
            ))}
        </svg>
    );
}

function ReinvestProgress({
    profit,
    reinvested,
    threshold,
}: {
    profit: number;
    reinvested: number;
    threshold: number;
}) {
    const unreinvested = Math.max(profit - reinvested, 0);
    const pct = Math.min((unreinvested / threshold) * 100, 100);
    const isReady = pct >= 100;

    return (
        <div className="reinvest-progress">
            <div className="reinvest-label">
                <span>Next reinvestment</span>
                <span>
                    ${unreinvested.toFixed(2)} / ${threshold.toFixed(2)}
                </span>
            </div>
            <div className="progress-bar">
                <div
                    className={`progress-fill ${isReady ? "ready" : ""}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function ActivityFeed({
    transactions,
    networkUrl,
}: {
    transactions: Transaction[];
    networkUrl: string;
}) {
    if (transactions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <div className="empty-state-text">
                    Waiting for agent activity...
                    <br />
                    Call the agent&apos;s API to see transactions flow
                </div>
            </div>
        );
    }

    return (
        <div className="activity-feed">
            {transactions.slice(0, 50).map((tx) => {
                const time = new Date(tx.created_at).toLocaleTimeString();
                let icon = "⚪";
                let text = "";

                if (tx.type === "revenue") {
                    icon = "🟢";
                    text = `Received <span class="amount earned">$${tx.amount.toFixed(2)}</span> — intel request${tx.address ? ` for ${tx.address.slice(0, 8)}...` : ""}`;
                } else if (tx.type === "expense") {
                    icon = "🔴";
                    text = `Paid <span class="amount spent">$${tx.amount.toFixed(2)}</span> — skills.${tx.skill}()`;
                } else if (tx.type === "reinvestment") {
                    icon = "🚀";
                    text = `Reinvested <span class="amount reinvest">$${tx.amount.toFixed(2)}</span> USDC → ETH${tx.tx_hash ? ` • <a href="${networkUrl}/tx/${tx.tx_hash}" target="_blank" class="reinvest-table .tx-link" style="color:var(--blue)">${tx.tx_hash.slice(0, 10)}...</a>` : ""}`;
                }

                return (
                    <div key={tx.id} className="activity-item">
                        <span className="activity-time">{time}</span>
                        <span className="activity-icon">{icon}</span>
                        <span
                            className="activity-text"
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function ReinvestmentTable({
    transactions,
    networkUrl,
}: {
    transactions: Transaction[];
    networkUrl: string;
}) {
    if (transactions.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🚀</div>
                <div className="empty-state-text">
                    No reinvestments yet — profit must exceed threshold
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: "0 20px 20px" }}>
            <table className="reinvest-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Amount</th>
                        <th>Asset</th>
                        <th>Tx Hash</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map((tx, i) => (
                        <tr key={tx.id}>
                            <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                            <td style={{ color: "var(--green)" }}>
                                ${tx.amount.toFixed(2)}
                            </td>
                            <td>ETH</td>
                            <td>
                                {tx.tx_hash ? (
                                    <a
                                        href={`${networkUrl}/tx/${tx.tx_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="tx-link"
                                    >
                                        {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-6)} ↗
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </td>
                            <td style={{ color: "var(--text-muted)" }}>
                                {new Date(tx.created_at).toLocaleTimeString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
