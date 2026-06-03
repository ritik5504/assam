import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signToken } from "@/lib/auth";

const MOCK_USERS = [
  {
    id: "mock-user-admin",
    name: "Dr. Aranya Sharma (Admin)",
    email: "admin@example.com",
    passwordHash: "$2b$10$0PaJEbTW8IcaLKUMIkQwGuGG3NC5oQSckeU5NTsgAs.YOq22viwRu", // admin123
    role: "admin"
  },
  {
    id: "mock-user-normal",
    name: "Prof. Ritik Singh",
    email: "user@example.com",
    passwordHash: "$2b$10$L55kn2i9P0S7lZt9HvhCnefuoioFduZnW8N9e9eW6KpanzvEaQ2NO", // user123
    role: "user"
  }
];

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    let user = null;

    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (err) {
      console.error("Database query failed in login API, checking mock fallback:", err);
    }

    // 1. Database user authentication
    if (user) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.name };
      const token = signToken(tokenPayload);

      const response = NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      response.cookies.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "lax",
      });

      return response;
    }

    // 2. Mock users authentication fallback
    const mockUser = MOCK_USERS.find((u) => u.email === email);
    if (mockUser) {
      const isValidMockPassword = await bcrypt.compare(password, mockUser.passwordHash);
      if (!isValidMockPassword) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const tokenPayload = { id: mockUser.id, email: mockUser.email, role: mockUser.role, name: mockUser.name };
      const token = signToken(tokenPayload);

      const response = NextResponse.json({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
      });

      response.cookies.set({
        name: "token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (error) {
    console.error("Error in login API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
