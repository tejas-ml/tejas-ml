import { NextResponse } from "next/server";
import { predictCompany, PredictError } from "@/lib/predict";

// Google News RSS is fetched at request time, so this must stay dynamic.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  let company = "";
  try {
    const body = await req.json();
    company = String(body?.company ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!company) {
    return NextResponse.json({ error: "Please enter a company name or ticker." }, { status: 400 });
  }
  if (company.length > 60) {
    return NextResponse.json({ error: "Company name is too long." }, { status: 400 });
  }

  try {
    const result = await predictCompany(company);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof PredictError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
