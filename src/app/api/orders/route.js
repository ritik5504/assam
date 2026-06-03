import { NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders
 *
 * AUTHENTICATED — Returns orders for the current user.
 *
 * Role behaviour:
 *  - ADMIN: Returns ALL orders from all users (for admin dashboard)
 *  - USER:  Returns ONLY their own orders (scoped by userId)
 *
 * Security: requireAuth() ensures only logged-in users can view orders.
 * Users cannot see other users' orders due to the userId filter.
 */
export async function GET(request) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { user: userSession, error } = requireAuth(request);
  if (error) return error; // 401 if not authenticated

  try {
    const isAdmin = userSession.role === "ADMIN";

    const query = {
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    };

    // Non-admin users only see their own orders
    if (!isAdmin) {
      query.where = { userId: userSession.id };
    }

    const orders = await prisma.order.findMany(query);
    return NextResponse.json(orders);
  } catch (dbError) {
    console.error("Error fetching orders:", dbError);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 *
 * AUTHENTICATED — Any logged-in user (USER or ADMIN) can place an order.
 *
 * Security:
 *  - Requires valid authentication (401 if not logged in)
 *  - Order is always created under the authenticated user's ID (userSession.id)
 *  - A user cannot create orders on behalf of another user
 */
export async function POST(request) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { user: userSession, error } = requireAuth(request);
  if (error) return error; // 401 if not authenticated

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { items, totalAmount } = body;

  if (!items || items.length === 0 || totalAmount === undefined) {
    return NextResponse.json(
      { error: "Missing order parameters: items and totalAmount are required" },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Verify the user exists in the database
      const dbUser = await tx.user.findUnique({ where: { id: userSession.id } });
      if (!dbUser) {
        throw new Error("User account not found. Please log out and log back in.");
      }

      // 2. Validate all products exist and have sufficient stock preview
      for (const item of items) {
        const dbProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!dbProduct) {
          throw new Error(`Product not found: ${item.productId}`);
        }
      }

      // 3. Create the order (status defaults to PENDING; stock decrements on APPROVAL)
      const newOrder = await tx.order.create({
        data: {
          userId: userSession.id, // Always use authenticated user's ID
          totalAmount: parseFloat(totalAmount),
          status: "PENDING",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity), // stored in base units (g, mL, item)
              price: parseFloat(item.price),        // price per base unit
              unit: item.unit || "g",               // user-selected display unit
              subtotal: parseFloat(item.price) * parseFloat(item.quantity),
            })),
          },
        },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (dbError) {
    console.error("Error creating order:", dbError);
    return NextResponse.json(
      { error: dbError.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
