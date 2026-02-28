// GET /api/timeseries — Returns time-series data for the profit chart
import { NextResponse } from "next/server";
import { getTimeSeries } from "@/db/index";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const data = getTimeSeries(24);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
