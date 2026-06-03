import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[id]
 *
 * AUTHENTICATED — Get full details of a specific order.
 *
 * Security:
 *  - Requires authentication (401 if not logged in)
 *  - ADMIN: Can view any order
 *  - USER: Can only view their own order (403 if they try to access another user's order)
 */
export async function GET(request, { params }) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { user: userSession, error } = requireAuth(request);
  if (error) return error;

  // Next.js 15+ params is a Promise
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security: Only the order owner OR an admin can view the full details.
    // This prevents users from enumerating other users' orders by guessing IDs.
    if (userSession.role !== "ADMIN" && order.userId !== userSession.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not have access to this order." },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (dbError) {
    console.error(`Error fetching order ${id}:`, dbError);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders/[id]
 *
 * ADMIN-ONLY — Update an order's lifecycle status.
 *
 * Security:
 *  - requireAdmin() → 401 if unauthenticated, 403 if authenticated but not ADMIN
 *  - Standard users cannot approve, reject, or complete orders
 *
 * Valid status transitions:
 *  PENDING  → APPROVED  (decrements product stock)
 *  PENDING  → REJECTED
 *  APPROVED → COMPLETED
 *  APPROVED → REJECTED  (restores product stock)
 *  APPROVED → CANCELLED (restores product stock)
 */
export async function PATCH(request, { params }) {
  // ── Admin-only authorization guard ──────────────────────────────────────
  const { error } = requireAdmin(request);
  if (error) return error; // 401 or 403

  // Next.js 15+ params is a Promise
  const { id } = await params;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status } = body;

  if (!status) {
    return NextResponse.json(
      { error: "Missing required field: status" },
      { status: 400 }
    );
  }

  const uppercaseStatus = status.toUpperCase();
  const validStatuses = ["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

  if (!validStatuses.includes(uppercaseStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch the current order state
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const currentStatus = existingOrder.status.toUpperCase();

      // 2. Stock management based on status transition
      if (currentStatus !== "APPROVED" && uppercaseStatus === "APPROVED") {
        // Transitioning INTO APPROVED: Check and decrement stock for each item
        for (const item of existingOrder.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Product not found for order item`);
          }

          if (parseFloat(product.stockQuantity) < parseFloat(item.quantity)) {
            throw new Error(
              `Insufficient stock for "${product.name}". ` +
              `Available: ${product.stockQuantity} ${product.baseUnit}, ` +
              `Required: ${item.quantity} ${product.baseUnit}`
            );
          }

          // Decrement stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });
        }
      } else if (
        currentStatus === "APPROVED" &&
        ["REJECTED", "CANCELLED"].includes(uppercaseStatus)
      ) {
        // Transitioning OUT OF APPROVED: Restore stock for each item
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });
        }
      }

      // 3. Update the order status
      return await tx.order.update({
        where: { id },
        data: { status: uppercaseStatus },
        include: {
          user: {
            select: { name: true, email: true },
          },
          items: {
            include: { product: true },
          },
        },
      });
    });

    return NextResponse.json(updatedOrder);
  } catch (dbError) {
    console.error(`Error updating order ${id} status:`, dbError);
    return NextResponse.json(
      { error: dbError.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
