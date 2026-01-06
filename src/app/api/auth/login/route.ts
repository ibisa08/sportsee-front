import { NextResponse } from "next/server";

const TOKEN_COOKIE = "sportsee_token";

export async function POST(req: Request) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Missing username/password" }, { status: 400 });
  }

  // IMPORTANT: ton backend expose POST /api/login (pas /login)
  const res = await fetch(`${apiBaseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Login failed", details: text },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { token: string; userId: number };

  const response = NextResponse.json({ ok: true, userId: data.userId });

  // Cookie httpOnly => non accessible via JS côté navigateur (plus secure)
  response.cookies.set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 jour
  });

  return response;
}