import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

/**
 * Optimistic gate: a page needs the token cookie. Whether the token is still valid is the API's call —
 * a 401 from it lands on /session-expired, which clears the cookie.
 */
export function proxy(req: NextRequest) {
  const signedIn = req.cookies.has(TOKEN_COOKIE);
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/projects", req.url)) : NextResponse.next();
  }
  if (!signedIn) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|session-expired|_next|brand|showcase|favicon.ico|icon.png).*)"],
};
