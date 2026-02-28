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

interface ActivityFeedProps {
    transactions: Transaction[];
    networkUrl: string;
}

export default function ActivityFeed({ transactions, networkUrl }: ActivityFeedProps) {
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
                    text = `Reinvested <span class="amount reinvest">$${tx.amount.toFixed(2)}</span> USDC → ETH${tx.tx_hash ? ` • <a href="${networkUrl}/tx/${tx.tx_hash}" target="_blank" style="color:var(--blue)">${tx.tx_hash.slice(0, 10)}... ↗</a>` : ""}`;
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
