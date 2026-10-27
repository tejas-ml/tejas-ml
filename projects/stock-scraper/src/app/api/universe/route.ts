import { NextResponse } from "next/server";
import { UNIQUE_UNIVERSE, EXCHANGES, SECTORS } from "@/lib/universe";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    count: UNIQUE_UNIVERSE.length,
    exchanges: EXCHANGES,
    sectors: SECTORS,
    stocks: UNIQUE_UNIVERSE,
  });
}
