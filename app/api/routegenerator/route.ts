import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello, Next.js 13!" });
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ message: "Hello, " + data.name + "!" });
}
