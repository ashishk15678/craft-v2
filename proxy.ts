import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes that require a valid session
const PROTECTED = ["/dashboard"];
// Routes only accessible when NOT logged in
const AUTH_ONLY = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request);
  const isAuthed = !!sessionCookie;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico
     * - /api/auth (better-auth endpoints must be reachable unauthenticated)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
