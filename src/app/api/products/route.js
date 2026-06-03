import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 *
 * Public endpoint — any authenticated or unauthenticated user can browse products.
 * No role restriction: users need to see products to place orders.
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 *
 * ADMIN-ONLY — Create a new chemical product in the inventory.
 *
 * Security: requireAdmin() checks:
 *   1. Valid JWT token (authenticated) → else 401
 *   2. role === "ADMIN"               → else 403 Forbidden
 *
 * Standard users will receive 403 Forbidden and cannot create products.
 */
export async function POST(request) {
  // ── Authorization guard ─────────────────────────────────────────────────
  const { user, error } = requireAdmin(request);
  if (error) return error; // 401 or 403 depending on auth state

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, sku, dimension, basePrice, stockQuantity, baseUnit, image } = body;

  if (!name || !sku || !dimension || basePrice === undefined || stockQuantity === undefined || !baseUnit) {
    return NextResponse.json(
      { error: "Missing required fields: name, sku, dimension, basePrice, stockQuantity, baseUnit" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        dimension,
        basePrice: parseFloat(basePrice),
        stockQuantity: parseFloat(stockQuantity),
        baseUnit,
        image: image || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (dbError) {
    console.error("Error creating product:", dbError);

    // Handle unique constraint violation (duplicate SKU)
    if (dbError.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products
 *
 * ADMIN-ONLY — Update an existing chemical product.
 *
 * Security: Same requireAdmin() guard as POST.
 * Standard users receive 403 Forbidden.
 */
export async function PUT(request) {
  // ── Authorization guard ─────────────────────────────────────────────────
  const { user, error } = requireAdmin(request);
  if (error) return error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, name, description, sku, dimension, basePrice, stockQuantity, baseUnit, image } = body;

  if (!id || !name || !sku || !dimension || basePrice === undefined || stockQuantity === undefined || !baseUnit) {
    return NextResponse.json(
      { error: "Missing required fields: id, name, sku, dimension, basePrice, stockQuantity, baseUnit" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        dimension,
        basePrice: parseFloat(basePrice),
        stockQuantity: parseFloat(stockQuantity),
        baseUnit,
        image: image || null,
      },
    });

    return NextResponse.json(product);
  } catch (dbError) {
    console.error("Error updating product:", dbError);

    if (dbError.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (dbError.code === "P2002") {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/products?id=<productId>
 *
 * ADMIN-ONLY — Permanently delete a product from the inventory.
 *
 * Security: Same requireAdmin() guard.
 * Standard users receive 403 Forbidden.
 */
export async function DELETE(request) {
  // ── Authorization guard ─────────────────────────────────────────────────
  const { user, error } = requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing product ID in query string" },
      { status: 400 }
    );
  }

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (dbError) {
    console.error("Error deleting product:", dbError);

    if (dbError.code === "P2025") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
