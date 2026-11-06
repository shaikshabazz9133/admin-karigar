import { NextResponse } from "next/server";
import { EMAIL_COOKIE, TOKEN_COOKIE } from "@/lib/session";

/** The API rejected the token: clear it and go back to sign-in. */
export function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/login?expired=1", req.url));
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(EMAIL_COOKIE);
  return res;
}
