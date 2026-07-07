import { SAMPLE_CASE, SAMPLE_TRANSCRIPT } from "@/lib/sample-transcript";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ case: SAMPLE_CASE, chunks: SAMPLE_TRANSCRIPT });
}
