import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { SignJWT } from "jose";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function POST(request: Request) {
  const { password } = await request.json();

  const hash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!hash || !secret) {
    return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
  }

  const inputHash = Buffer.from(sha256(password));
  const storedHash = Buffer.from(hash);
  const isValid =
    inputHash.length === storedHash.length &&
    timingSafeEqual(inputHash, storedHash);

  if (!isValid) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
