// SQLite database for Autonome — stores all transactions, metrics, and agent state
// Uses better-sqlite3 for synchronous, fast, zero-config embedded storage

import Database from "better-sqlite3";
import path from "path";
import { DEFAULTS } from "../lib/constants";
import type {
    Transaction,
    Reinvestment,
    AgentMetrics,
    TimeSeriesPoint,
} from "../agent/types";

const DB_FILE = path.resolve(process.cwd(), DEFAULTS.DB_PATH);

let db: Database.Database | null = null;

/**
 * Get the singleton database connection (creates + initializes on first call).
 */
export function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_FILE);
        db.pragma("journal_mode = WAL"); // faster concurrent reads
        initSchema(db);
    }
    return db;
}

/**
 * Create tables if they don't exist.
 */
function initSchema(database: Database.Database): void {
    database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('revenue', 'expense', 'reinvestment')),
      skill TEXT,
      amount REAL NOT NULL,
      address TEXT,
      tx_hash TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
  `);
}

// ─── WRITE OPERATIONS ─────────────────────────────────────────────────

export function recordRevenue(amount: number, address: string): void {
    const database = getDb();
    database
        .prepare(
            `INSERT INTO transactions (type, amount, address) VALUES ('revenue', ?, ?)`
        )
        .run(amount, address);
}

export function recordExpense(skill: string, amount: number): void {
    const database = getDb();
    database
        .prepare(
            `INSERT INTO transactions (type, skill, amount) VALUES ('expense', ?, ?)`
        )
        .run(skill, amount);
}

export function recordReinvestment(amount: number, txHash: string): void {
    const database = getDb();
    database
        .prepare(
            `INSERT INTO transactions (type, amount, tx_hash) VALUES ('reinvestment', ?, ?)`
        )
        .run(amount, txHash);
}

export function setAgentState(key: string, value: string): void {
    const database = getDb();
    database
        .prepare(
            `INSERT OR REPLACE INTO agent_state (key, value, updated_at) VALUES (?, ?, datetime('now'))`
        )
        .run(key, value);
}

// ─── READ OPERATIONS ──────────────────────────────────────────────────

export function getMetrics(): AgentMetrics {
    const database = getDb();

    const revenue = database
        .prepare(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'revenue'`
        )
        .get() as { total: number };

    const expenses = database
        .prepare(
            `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`
        )
        .get() as { total: number };

    const requests = database
        .prepare(
            `SELECT COUNT(*) as count FROM transactions WHERE type = 'revenue'`
        )
        .get() as { count: number };

    const skillCalls = database
        .prepare(
            `SELECT COUNT(*) as count FROM transactions WHERE type = 'expense'`
        )
        .get() as { count: number };

    const reinvestments = database
        .prepare(
            `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'reinvestment'`
        )
        .get() as { count: number; total: number };

    const ethBalance =
        (
            database
                .prepare(`SELECT value FROM agent_state WHERE key = 'eth_balance'`)
                .get() as { value: string } | undefined
        )?.value || "0";

    const usdcBalance =
        (
            database
                .prepare(`SELECT value FROM agent_state WHERE key = 'usdc_balance'`)
                .get() as { value: string } | undefined
        )?.value || "0";

    return {
        totalRevenue: revenue.total,
        totalExpenses: expenses.total,
        totalProfit: revenue.total - expenses.total,
        totalRequests: requests.count,
        totalSkillCalls: skillCalls.count,
        totalReinvestments: reinvestments.count,
        reinvestedAmount: reinvestments.total,
        currentEthBalance: ethBalance,
        currentUsdcBalance: usdcBalance,
    };
}

export function getRecentTransactions(limit: number = 50): Transaction[] {
    const database = getDb();
    return database
        .prepare(
            `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?`
        )
        .all(limit) as Transaction[];
}

export function getReinvestmentHistory(): Reinvestment[] {
    const database = getDb();
    return database
        .prepare(
            `SELECT id, amount, tx_hash as txHash, created_at as createdAt 
       FROM transactions WHERE type = 'reinvestment' 
       ORDER BY created_at DESC`
        )
        .all() as Reinvestment[];
}

export function getTimeSeries(hours: number = 24): TimeSeriesPoint[] {
    const database = getDb();

    // Group transactions by 5-minute buckets for chart data
    const rows = database
        .prepare(
            `SELECT 
        strftime('%Y-%m-%dT%H:%M:00', created_at) as timestamp,
        SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
       FROM transactions
       WHERE created_at > datetime('now', '-' || ? || ' hours')
       GROUP BY strftime('%Y-%m-%dT%H:%M:00', created_at)
       ORDER BY timestamp ASC`
        )
        .all(hours) as Array<{
            timestamp: string;
            revenue: number;
            expenses: number;
        }>;

    // Compute cumulative profit
    let cumRevenue = 0;
    let cumExpenses = 0;

    return rows.map((row) => {
        cumRevenue += row.revenue;
        cumExpenses += row.expenses;
        return {
            timestamp: row.timestamp,
            revenue: cumRevenue,
            expenses: cumExpenses,
            profit: cumRevenue - cumExpenses,
        };
    });
}

export function getAgentState(key: string): string | null {
    const database = getDb();
    const row = database
        .prepare(`SELECT value FROM agent_state WHERE key = ?`)
        .get(key) as { value: string } | undefined;
    return row?.value || null;
}
