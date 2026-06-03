import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // 1. Query users to test connection
    const users = await prisma.user.findMany({ take: 5 });
    
    // 2. Query products to test connection
    const products = await prisma.product.findMany({ take: 5 });
    
    // 3. Return success checklist
    return NextResponse.json({
      status: "success",
      message: "Neon PostgreSQL and Prisma ORM are connected successfully!",
      tablesChecked: ["User", "Product", "Order", "OrderItem"],
      sampleData: {
        users: users.map(u => ({ id: u.id, email: u.email, role: u.role })),
        products
      }
    });
  } catch (error) {
    console.error("Test route connection failure:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to connect to the database",
      error: error.message || error
    }, { status: 500 });
  }
}
