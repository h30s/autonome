"use client";

interface Transaction {
    id: number;
    type: "revenue" | "expense" | "reinvestment";
    skill: string | null;
    amount: number;
    address: string | null;
    tx_hash: string | null;
    created_at: string;
}

interface ReinvestLogProps {
    transactions: Transaction[];
    networkUrl: string;
}

export default function ReinvestLog({ transactions, networkUrl }: ReinvestLogProps) {
    const reinvestments = transactions.filter((t) => t.type === "reinvestment");

    if (reinvestments.length === 0) {
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
                    {reinvestments.map((tx, i) => (
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
