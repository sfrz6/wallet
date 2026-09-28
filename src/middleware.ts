import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name is inlined to avoid pulling Node-only modules into the edge runtime.
const SESSION_COOKIE = "mahfazati_session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/accounts",
  "/categories",
  "/transactions",
  "/debts",
  "/reports",
  "/settings",
  "/onboarding",
];

/**
 * Defense-in-depth redirect: users without a session cookie are sent to login
 * before a protected page renders. Full session validation and authorization
 * still happen server-side on every request.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/accounts/:path*",
    "/categories/:path*",
    "/transactions/:path*",
    "/debts/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
