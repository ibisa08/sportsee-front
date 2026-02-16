import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "sportsee_token";

async function fetchFirstOk(urls: string[], token: string) {
  let lastText = "";
  let lastStatus = 0;

  for (const u of urls) {
    const res = await fetch(u, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    lastStatus = res.status;
    lastText = await res.text();

    if (res.ok) {
      return { ok: true as const, status: res.status, text: lastText };
    }
  }

  return {
    ok: false as const,
    status: lastStatus || 502,
    text: lastText || "No matching endpoint",
  };
}

export async function GET(req: Request) {
  // ✅ Next 16 : cookies() est async
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiBaseUrl =
    process.env.SPORTSEE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "12";
  const startWeek = url.searchParams.get("startWeek") ?? "2025-01-01";
  const endWeek = url.searchParams.get("endWeek") ?? "2025-01-31";

  const candidates = [
    `${apiBaseUrl}/api/user-activity?startWeek=${encodeURIComponent(startWeek)}&endWeek=${encodeURIComponent(endWeek)}`,
    `${apiBaseUrl}/api/user-activity?userId=${encodeURIComponent(userId)}&startWeek=${encodeURIComponent(startWeek)}&endWeek=${encodeURIComponent(endWeek)}`,
    `${apiBaseUrl}/api/user/${encodeURIComponent(userId)}/activity?startWeek=${encodeURIComponent(startWeek)}&endWeek=${encodeURIComponent(endWeek)}`,
    `${apiBaseUrl}/user/${encodeURIComponent(userId)}/activity?startWeek=${encodeURIComponent(startWeek)}&endWeek=${encodeURIComponent(endWeek)}`,
  ];

  const out = await fetchFirstOk(candidates, token);

  return new NextResponse(out.text, {
    status: out.status,
    headers: { "Content-Type": "application/json" },
  });
}