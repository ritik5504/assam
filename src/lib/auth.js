import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "assamedchem-super-secret-jwt-key";

/**
 * Signs a payload into a JWT token.
 * @param {object} payload 
 * @returns {string}
 */
export function signToken(payload) {
  // Ensure the role payload is standard uppercase (USER / ADMIN)
  const tokenPayload = {
    ...payload,
    role: (payload.role || "USER").toUpperCase()
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token.
 * @param {string} token 
 * @returns {object|null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Gets the authenticated user from the Request object.
 * Suitable for Route Handlers (API routes).
 * @param {Request} request 
 * @returns {object|null}
 */
export function getUserFromRequest(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * Gets the authenticated user in Server Components (async).
 * @returns {Promise<object|null>}
 */
export async function getUserFromServer() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (err) {
    return null;
  }
}
