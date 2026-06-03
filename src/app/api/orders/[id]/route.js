import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const userSession = getUserFromRequest(request);
  
  if (!userSession || userSession.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  // Next.js 15+ params is a Promise
  const { id } = await params;

  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status) {
    return NextResponse.json({ error: "Missing status parameter" }, { status: 400 });
  }

  const uppercaseStatus = status.toUpperCase();
  if (!["PENDING", "APPROVED", "CANCELLED"].includes(uppercaseStatus)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: uppercaseStatus },
      include: {
        user: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order ${id} status:`, error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
