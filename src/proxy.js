import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * Next.js Proxy (formerly Middleware) — Server-Side Route Protection (RBAC)
 *
 * This proxy runs BEFORE any page or API route is rendered.
 * It enforces Role-Based Access Control at the network edge for two tiers:
 *
 * 1. AUTHENTICATED routes (/dashboard, /products, /orders, /orders/:id)
 *    - Requires a valid JWT token in the "token" cookie.
 *    - If unauthenticated → redirect to /login
 *
 * 2. ADMIN-ONLY routes (/admin, /admin/*)
 *    - Requires a valid JWT token AND role === "ADMIN".
 *    - If unauthenticated → redirect to /login
 *    - If authenticated but not ADMIN → redirect to /dashboard (403-equivalent UX)
 *
 * Security Guarantees:
 *  - Admin pages are NEVER rendered for non-admin users, even if they know the URL.
 *  - Users cannot bypass this by disabling JavaScript — it runs server-side.
 *  - Role is read from the JWT signature, so it cannot be tampered with client-side.
 *  - All new registrations receive role = "USER" (hardcoded in the register API).
 *  - Admin accounts are manually seeded; cannot be created via registration.
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;

  // ── Read and verify JWT from HttpOnly cookie ──────────────────────────────
  const token = request.cookies.get("token")?.value ?? null;
  const user = token ? verifyToken(token) : null;

  // ── ADMIN-ONLY routes ─────────────────────────────────────────────────────
  // Any path starting with /admin requires both authentication AND ADMIN role.
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Not logged in at all → redirect to login page
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname); // preserve original destination
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "ADMIN") {
      // Logged in but NOT an admin → redirect to their dashboard
      // Users cannot self-promote to ADMIN; role comes from the signed JWT only.
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Authenticated ADMIN → allow request through
    return NextResponse.next();
  }

  // ── AUTHENTICATED-ONLY routes ─────────────────────────────────────────────
  // These routes require login but have no role restriction beyond authentication.
  const protectedRoutes = ["/dashboard", "/products", "/orders"];
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !user) {
    // Not logged in → redirect to login page
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which paths this proxy applies to.
 * Exclude static files, images, and Next.js internals for performance.
 */
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/dashboard",
    "/products/:path*",
    "/products",
    "/orders/:path*",
    "/orders",
  ],
};
