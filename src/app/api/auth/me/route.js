import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = getUserFromRequest(request);
  return NextResponse.json({ user });
}

export async function POST(request) {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("token");
  return response;
}
