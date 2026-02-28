// Demo seed — populates the database with realistic sample data
// Run with: npm run seed

import Database from "better-sqlite3";
import path from "path";

const DB_FILE = path.resolve(process.cwd(), "autonome.db");
const db = new Database(DB_FILE);

// Initialize schema
db.exec(`
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
`);

// Clear existing data
db.exec(`DELETE FROM transactions`);
db.exec(`DELETE FROM agent_state`);

console.log("🌱 Seeding demo data...\n");

// Set agent state
db.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value) VALUES (?, ?)`
).run("status", "running");
db.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value) VALUES (?, ?)`
).run("started_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());
db.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value) VALUES (?, ?)`
).run("eth_balance", "0.00042");
db.prepare(
    `INSERT OR REPLACE INTO agent_state (key, value) VALUES (?, ?)`
).run("usdc_balance", "46.18");

// Helper to insert transactions at specific past times
const insertTx = db.prepare(
    `INSERT INTO transactions (type, skill, amount, address, tx_hash, created_at) 
   VALUES (?, ?, ?, ?, ?, datetime('now', ? || ' minutes'))`
);

// Simulate ~25 intel requests over the last 2 hours
const addresses = [
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // vitalik
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", // VB2
    "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD45",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
];

let totalRevenue = 0;
let totalExpenses = 0;

for (let i = 0; i < 25; i++) {
    const minutesAgo = -(120 - i * 5); // spread across 2 hours
    const addr = addresses[i % addresses.length];

    // Revenue from incoming request
    insertTx.run("revenue", null, 0.08, addr, null, minutesAgo.toString());
    totalRevenue += 0.08;

    // Expenses for 4 skill calls per request
    const skills = ["balance", "price", "fund", "chat"];
    for (const skill of skills) {
        insertTx.run(
            "expense",
            skill,
            0.01,
            null,
            null,
            (minutesAgo + 0.5).toString()
        );
        totalExpenses += 0.01;
    }
}

// Add 2 reinvestments
insertTx.run(
    "reinvestment",
    null,
    0.40,
    null,
    "0x7f3a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
    "-45"
);

insertTx.run(
    "reinvestment",
    null,
    0.42,
    null,
    "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "-10"
);

console.log(`✅ Seeded successfully!`);
console.log(`   📥 ${25} revenue events ($${totalRevenue.toFixed(2)})`);
console.log(`   📤 ${25 * 4} expense events ($${totalExpenses.toFixed(2)})`);
console.log(`   🚀 2 reinvestments ($0.82)`);
console.log(`   📈 Net profit: $${(totalRevenue - totalExpenses).toFixed(2)}`);
console.log(`\n   Start the dashboard with: npm run dev:dashboard\n`);

db.close();
