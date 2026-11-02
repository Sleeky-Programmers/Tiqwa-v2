import { NextResponse, type NextRequest } from "next/server";

// Kept in sync with SESSION_COOKIE in src/lib/api/upstream.ts (Proxy shouldn't import app modules).
const SESSION_COOKIE = "tiqwa_session";

/**
 * Account routing. With a backend configured, /dashboard needs a session (the token itself is
 * checked by the API; an expired one signs the user out on the client). Signed-in users skip
 * the login/sign-up screens. Without a backend the demo dashboard stays open.
 */
export function proxy(request: NextRequest) {
  if (!process.env.TIQWA_API_URL) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/dashboard") && !signedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/signup") && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
