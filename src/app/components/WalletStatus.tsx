"use client";

interface WalletStatusProps {
    ethBalance: string;
    usdcBalance: string;
    totalProfit: number;
    reinvestedAmount: number;
    totalReinvestments: number;
    reinvestThreshold: number;
    totalExpenses?: number;
    spendLimit?: number;
}

export default function WalletStatus({
    ethBalance,
    usdcBalance,
    totalProfit,
    reinvestedAmount,
    totalReinvestments,
    reinvestThreshold,
    totalExpenses = 0,
    spendLimit = 5.0,
}: WalletStatusProps) {
    const unreinvested = Math.max(totalProfit - reinvestedAmount, 0);
    const pct = Math.min((unreinvested / reinvestThreshold) * 100, 100);
    const isReady = pct >= 100;

    // spend_limit tracking — PinionOS SDK feature
    const spendPct = Math.min((totalExpenses / spendLimit) * 100, 100);
    const spendExhausted = spendPct >= 90;

    return (
        <div className="card">
            <div className="card-header">
                <span className="card-title">🏦 Agent Wallet</span>
            </div>
            <div className="card-body">
                <div className="wallet-item">
                    <span className="wallet-token">ETH</span>
                    <span className="wallet-amount">
                        {parseFloat(ethBalance || "0").toFixed(6)}
                    </span>
                </div>
                <div className="wallet-item">
                    <span className="wallet-token">USDC</span>
                    <span className="wallet-amount">
                        {parseFloat(usdcBalance || "0").toFixed(2)}
                    </span>
                </div>

                {/* Reinvestment progress bar */}
                <div className="reinvest-progress">
                    <div className="reinvest-label">
                        <span>Next reinvestment</span>
                        <span>
                            ${unreinvested.toFixed(2)} / ${reinvestThreshold.toFixed(2)}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${isReady ? "ready" : ""}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* spend_limit tracking — PinionOS SDK feature */}
                <div className="reinvest-progress">
                    <div className="reinvest-label">
                        <span>Session spend limit</span>
                        <span style={{ color: spendExhausted ? "var(--red)" : "var(--text-muted)" }}>
                            ${totalExpenses.toFixed(2)} / ${spendLimit.toFixed(2)}
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${spendExhausted ? "ready" : ""}`}
                            style={{
                                width: `${spendPct}%`,
                                background: spendExhausted
                                    ? "linear-gradient(90deg, var(--red-dim), var(--red))"
                                    : undefined,
                            }}
                        />
                    </div>
                </div>

                {totalReinvestments > 0 && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                        🚀 {totalReinvestments} reinvestment(s) •
                        ${reinvestedAmount.toFixed(2)} total
                    </div>
                )}
            </div>
        </div>
    );
}

