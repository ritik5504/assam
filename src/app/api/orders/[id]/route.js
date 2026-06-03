import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const userSession = getUserFromRequest(request);
  
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next.js 15+ params is a Promise
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security: Only admins or the owner of the order can view details
    if (userSession.role !== "ADMIN" && order.userId !== userSession.id) {
      return NextResponse.json({ error: "Unauthorized access to this order" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(`Error fetching order ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

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
  if (!["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"].includes(uppercaseStatus)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch current order to check current status and items
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const currentStatus = existingOrder.status.toUpperCase();

      // 2. Adjust stock if status changes
      if (currentStatus !== "APPROVED" && uppercaseStatus === "APPROVED") {
        // PENDING/REJECTED/CANCELLED -> APPROVED: check and decrement stock
        for (const item of existingOrder.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          if (!product) {
            throw new Error(`Product not found`);
          }
          if (parseFloat(product.stockQuantity) < parseFloat(item.quantity)) {
            throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stockQuantity}, Required: ${item.quantity}`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity
              }
            }
          });
        }
      } else if (currentStatus === "APPROVED" && ["REJECTED", "CANCELLED"].includes(uppercaseStatus)) {
        // APPROVED -> REJECTED/CANCELLED: restore stock
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity
              }
            }
          });
        }
      }

      // 3. Perform order update
      return await tx.order.update({
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
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(`Error updating order ${id} status:`, error);
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 500 });
  }
}
