"use client";

interface TimeSeriesPoint {
    timestamp: string;
    revenue: number;
    expenses: number;
    profit: number;
}

interface ProfitChartProps {
    data: TimeSeriesPoint[];
}

export default function ProfitChart({ data }: ProfitChartProps) {
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

    // Custom SVG chart — zero external dependency
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
