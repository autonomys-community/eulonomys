import { NextResponse } from "next/server";
import { createNonce } from "@/lib/nonceStore";

export async function GET() {
  return NextResponse.json({ nonce: await createNonce() });
}
