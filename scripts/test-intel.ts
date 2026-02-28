// Test Intelligence Pipeline — Run a complete intel report against a known address
// Usage: npm run test:intel
//   or:  npx tsx scripts/test-intel.ts [address]

import { PinionClient } from "pinion-os";
import { generateIntelReport } from "../src/agent/intelligence";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

async function main() {
    const address = process.argv[2] || DEFAULT_ADDRESS;

    console.log("═══════════════════════════════════════════════════");
    console.log("  🧪 AUTONOME — Intelligence Pipeline Test");
    console.log("═══════════════════════════════════════════════════");
    console.log(`  Target: ${address}`);
    console.log("═══════════════════════════════════════════════════\n");

    const privateKey = process.env.PINION_PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ PINION_PRIVATE_KEY not set. Configure .env.local first.\n");
        process.exit(1);
    }

    const network = (process.env.PINION_NETWORK || "base-sepolia") as "base" | "base-sepolia";
    console.log(`📡 Network: ${network}`);
    console.log("🔑 PinionClient initializing...\n");

    const pinion = new PinionClient({ privateKey, network });

    console.log("🚀 Running intelligence pipeline...\n");
    const startTime = Date.now();

    try {
        const report = await generateIntelReport(pinion, address);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("═══════════════════════════════════════════════════");
        console.log("  ✅ INTELLIGENCE REPORT");
        console.log("═══════════════════════════════════════════════════\n");

        console.log(`  Address:          ${report.address}`);
        console.log(`  Timestamp:        ${report.timestamp}`);
        console.log(`  ETH Balance:      ${report.balances.ETH} ETH`);
        console.log(`  USDC Balance:     ${report.balances.USDC} USDC`);
        console.log(`  ETH Price:        $${report.ethPriceUsd}`);
        console.log(`  Portfolio Value:  $${report.portfolioValueUsd}`);
        console.log(`  Risk Score:       ${report.riskScore}/100`);
        console.log(`  Wallet Category:  ${report.walletCategory}`);
        console.log(`  Portfolio Health: ${report.portfolioHealth}`);
        console.log(`  Activity Pattern: ${report.activityPattern}`);
        console.log(`  Anomalies:        ${report.anomalies.length > 0 ? report.anomalies.join(", ") : "None"}`);
        console.log();
        console.log(`  📝 AI Summary:`);
        console.log(`     ${report.aiSummary}`);
        console.log();
        console.log(`  💡 Recommendation:`);
        console.log(`     ${report.recommendation}`);
        console.log();
        console.log(`  ── COST BREAKDOWN ──`);
        console.log(`  Skills used:      ${report.skillsUsed.join(", ")}`);
        console.log(`  Total cost:       $${report.costToGenerate}`);
        console.log(`  Time elapsed:     ${elapsed}s`);
        console.log();
        console.log("═══════════════════════════════════════════════════");
        console.log("  ✅ Test PASSED — Pipeline working correctly");
        console.log("═══════════════════════════════════════════════════\n");
    } catch (error: any) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ Pipeline FAILED after ${elapsed}s`);
        console.error(`   Error: ${error.message}\n`);
        process.exit(1);
    }
}

main();
