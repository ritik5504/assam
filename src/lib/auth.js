import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "assamedchem-super-secret-jwt-key";

/**
 * Signs a user payload into a JWT token.
 *
 * Security: The role in the token is normalised to uppercase and sourced
 * only from the database — never from client input. This means a user
 * cannot forge a higher-privilege token by manipulating request data.
 *
 * @param {object} payload - { id, email, name, role }
 * @returns {string} Signed JWT valid for 7 days
 */
export function signToken(payload) {
  const tokenPayload = {
    ...payload,
    role: (payload.role || "USER").toUpperCase(), // Normalise; default to USER
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token and returns its decoded payload.
 * Returns null if the token is invalid, expired, or tampered with.
 *
 * @param {string} token
 * @returns {object|null} Decoded payload or null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Token invalid, expired, or signature mismatch
  }
}

/**
 * Gets the authenticated user from a Route Handler's Request object.
 * Reads the HttpOnly "token" cookie and verifies the JWT signature.
 *
 * @param {Request} request - Next.js Route Handler request object
 * @returns {object|null} Decoded user payload or null if not authenticated
 */
export function getUserFromRequest(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Gets the authenticated user in Server Components / Server Actions.
 * Uses Next.js `cookies()` API (async in Next.js 15+).
 *
 * @returns {Promise<object|null>} Decoded user payload or null
 */
export async function getUserFromServer() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * requireAuth — Guard helper for authenticated-only API routes.
 *
 * Usage in a Route Handler:
 *   const { user, error } = requireAuth(request);
 *   if (error) return error;
 *
 * @param {Request} request
 * @returns {{ user: object } | { error: NextResponse }}
 */
export function requireAuth(request) {
  const user = getUserFromRequest(request);
  if (!user) {
    return {
      error: Response.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * requireAdmin — Guard helper for ADMIN-only API routes.
 *
 * Security:
 *  - Checks both authentication (valid JWT) AND authorisation (role === ADMIN).
 *  - Returns 401 if unauthenticated; 403 if authenticated but not ADMIN.
 *  - Users cannot self-promote to ADMIN — the role comes from the signed JWT only.
 *
 * Usage in a Route Handler:
 *   const { user, error } = requireAdmin(request);
 *   if (error) return error;
 *
 * @param {Request} request
 * @returns {{ user: object } | { error: Response }}
 */
export function requireAdmin(request) {
  const user = getUserFromRequest(request);

  if (!user) {
    // 401 Unauthorized — no valid session
    return {
      error: Response.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    // 403 Forbidden — authenticated but insufficient privileges
    // A standard USER can never access this resource.
    return {
      error: Response.json(
        { error: "Forbidden. Administrator access required." },
        { status: 403 }
      ),
    };
  }

  return { user };
}
