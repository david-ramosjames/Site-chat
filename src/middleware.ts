import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Gates the admin UI and the admin REST API behind a valid NextAuth
// session. Public widget endpoints (/api/leads, /api/widget-config,
// /api/auth/*) are NOT matched here — see the matcher below.
//
// Two enforcement modes:
//   - HTML / page request → 302 redirect to /login?callbackUrl=…
//   - JSON / API request  → 401 with {"error":"unauthenticated"}
//
// This way the admin pages bounce visitors to Google sign-in, while
// admin API calls fail loudly instead of returning the login HTML.

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token) return NextResponse.next();

  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isApi) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
