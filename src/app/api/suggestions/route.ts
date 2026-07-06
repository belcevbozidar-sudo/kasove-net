import { NextResponse } from "next/server";
import { getBestSellers } from "@/lib/products-server";

export async function GET() {
  const items = await getBestSellers(8);
  return NextResponse.json(items);
}
