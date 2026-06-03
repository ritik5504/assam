import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 *
 * Security: Every newly registered user ALWAYS receives role = "USER".
 *
 * The `role` field is intentionally ignored even if sent in the request body.
 * Admin accounts are NEVER created through this endpoint — they must be
 * seeded manually via `npx prisma db seed` by a system administrator.
 *
 * This prevents any form of privilege escalation through self-registration.
 */
export async function POST(req) {
  try {
    // Destructure body — note: `role` is intentionally NOT destructured.
    // Even if a client sends role: "ADMIN" in the body, it will be ignored.
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Hash the password with bcrypt (cost factor 12 for production security)
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }

      /**
       * SECURITY: Role is ALWAYS hardcoded to "USER".
       * Users cannot self-promote by sending role: "ADMIN" in the request body.
       * Admin accounts must be created via the seed script by a system admin.
       */
      const user = await prisma.user.create({
        data: {
          name: name?.trim() || "New User",
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          role: "USER", // ← Always USER. Never accept role from client input.
        },
      });

      // Return user data without the password hash
      const { password: _, ...result } = user;
      return NextResponse.json(result, { status: 201 });

    } catch (dbError) {
      console.error("Database error in register API:", dbError);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in register API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
