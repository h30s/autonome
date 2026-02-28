"use client";

import { useState, useEffect, useCallback } from "react";
import Dashboard from "./components/Dashboard";

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
// MAIN PAGE — Data fetching + Dashboard rendering
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

    return (
        <Dashboard
            metrics={metrics}
            transactions={transactions}
            timeSeries={timeSeries}
            agentStatus={agentStatus}
            lastUpdate={lastUpdate}
            onRefresh={fetchData}
        />
    );
}
