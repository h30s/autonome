// GET /api/transactions — Returns recent transactions for the activity feed
import { NextResponse } from "next/server";
import { getRecentTransactions } from "@/db/index";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const transactions = getRecentTransactions(100);
        return NextResponse.json(transactions);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
