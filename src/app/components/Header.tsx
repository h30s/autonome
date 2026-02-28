"use client";

interface HeaderProps {
    agentStatus: string;
    lastUpdate: string;
}

export default function Header({ agentStatus, lastUpdate }: HeaderProps) {
    return (
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
    );
}
