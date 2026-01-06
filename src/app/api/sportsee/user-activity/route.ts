import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "sportsee_token";

export async function GET(req: Request) {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // On accepte startWeek/endWeek, sinon on force une plage connue qui renvoie plusieurs séances
  const url = new URL(req.url);
  const startWeek = url.searchParams.get("startWeek") ?? "2025-01-01";
  const endWeek = url.searchParams.get("endWeek") ?? "2025-01-31";

  const res = await fetch(
    `${apiBaseUrl}/api/user-activity?startWeek=${encodeURIComponent(startWeek)}&endWeek=${encodeURIComponent(endWeek)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}