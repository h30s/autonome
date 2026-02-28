"use client";

interface MetricCardProps {
    label: string;
    value: number;
    color: string;
    sub: string;
    className: string;
}

export function MetricCard({ label, value, color, sub, className }: MetricCardProps) {
    return (
        <div className={`metric-card ${className}`}>
            <div className="metric-label">{label}</div>
            <div className={`metric-value ${color}`}>${value.toFixed(4)}</div>
            <div className="metric-sub">{sub}</div>
        </div>
    );
}

interface MetricsPanelProps {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalRequests: number;
    totalSkillCalls: number;
}

export default function MetricsPanel({
    totalRevenue,
    totalExpenses,
    totalProfit,
    totalRequests,
    totalSkillCalls,
}: MetricsPanelProps) {
    return (
        <div className="metrics-grid">
            <MetricCard
                label="💰 Revenue"
                value={totalRevenue}
                color="green"
                sub={`${totalRequests} requests served`}
                className="revenue"
            />
            <MetricCard
                label="💸 Expenses"
                value={totalExpenses}
                color="red"
                sub={`${totalSkillCalls} skill calls made`}
                className="expenses"
            />
            <MetricCard
                label="📈 Net Profit"
                value={totalProfit}
                color="gold"
                sub={
                    totalRevenue > 0
                        ? `${((totalProfit / totalRevenue) * 100).toFixed(0)}% margin`
                        : "Awaiting first request"
                }
                className="profit"
            />
        </div>
    );
}
