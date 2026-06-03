import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MOCK_USERS = [
  {
    id: "mock-user-admin",
    name: "Dr. Aranya Sharma (Admin)",
    email: "admin@example.com",
    password: "mock-password-hash",
    role: "ADMIN"
  },
  {
    id: "mock-user-normal",
    name: "Prof. Ritik Singh",
    email: "user@example.com",
    password: "mock-password-hash",
    role: "USER"
  }
];

const MOCK_PRODUCTS = [
  {
    id: "mock-1",
    name: "Hydrochloric Acid 37% ACS",
    description: "Reagent grade hydrochloric acid suitable for titration and inorganic synthesis.",
    sku: "CHEM-HCL-37",
    dimension: "Liquid",
    basePrice: 24.50,
    stockQuantity: 45.0,
    baseUnit: "L",
    image: null,
  },
  {
    id: "mock-2",
    name: "Sodium Hydroxide Pellets",
    description: "Anhydrous NaOH pellets, suitable for pH adjustment and general laboratory use.",
    sku: "CHEM-NAOH-PL",
    dimension: "Solid",
    basePrice: 18.20,
    stockQuantity: 30.0,
    baseUnit: "kg",
    image: null,
  },
  {
    id: "mock-3",
    name: "Ethanol 99% ACS Grade",
    description: "Pure dehydrated ethanol, ACS reagent grade for extraction and sterilization.",
    sku: "CHEM-ETOH-99",
    dimension: "Liquid",
    basePrice: 35.00,
    stockQuantity: 15.5,
    baseUnit: "L",
    image: null,
  },
  {
    id: "mock-4",
    name: "Acetone ACS Grade",
    description: "Highly pure acetone solvent, suitable for clearing and organic reactions.",
    sku: "CHEM-ACET-ACS",
    dimension: "Liquid",
    basePrice: 22.00,
    stockQuantity: 0.0,
    baseUnit: "L",
    image: null,
  }
];

export async function GET(request) {
  const userSession = getUserFromRequest(request);
  
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isSharedAdmin = userSession.role?.toUpperCase() === "ADMIN";

    const query = {
      include: {
        user: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
    };

    if (!isSharedAdmin) {
      query.where = { userId: userSession.id };
    }

    const orders = await prisma.order.findMany(query);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Prisma error in GET orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request) {
  const userSession = getUserFromRequest(request);
  
  if (!userSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { items, totalAmount } = body;
  if (!items || items.length === 0 || totalAmount === undefined) {
    return NextResponse.json({ error: "Missing order parameters" }, { status: 400 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Ensure user record exists in the database
      let dbUser = await tx.user.findUnique({ where: { id: userSession.id } });
      if (!dbUser) {
        const mockUser = MOCK_USERS.find(u => u.id === userSession.id);
        dbUser = await tx.user.create({
          data: {
            id: userSession.id,
            name: userSession.name || mockUser?.name || "Mock User",
            email: userSession.email || mockUser?.email || "mock@example.com",
            password: mockUser?.password || "mock-password-hash",
            role: userSession.role || mockUser?.role || "USER",
          }
        });
      }

      // 2. Ensure each product record exists in the database (due to mock fallback items in catalog)
      for (const item of items) {
        let dbProduct = await tx.product.findUnique({ where: { id: item.productId } });
        if (!dbProduct) {
          const mockProduct = MOCK_PRODUCTS.find(p => p.id === item.productId);
          if (mockProduct) {
            dbProduct = await tx.product.create({
              data: {
                id: mockProduct.id,
                name: mockProduct.name,
                description: mockProduct.description,
                sku: mockProduct.sku,
                dimension: mockProduct.dimension,
                basePrice: mockProduct.basePrice,
                stockQuantity: mockProduct.stockQuantity,
                baseUnit: mockProduct.baseUnit,
                image: mockProduct.image
              }
            });
          } else {
            // Fallback placeholder
            dbProduct = await tx.product.create({
              data: {
                id: item.productId,
                name: "Placeholder Chemical",
                sku: "CHEM-" + item.productId.slice(0, 8).toUpperCase(),
                dimension: "Liquid",
                basePrice: parseFloat(item.price),
                stockQuantity: 100.0,
                baseUnit: item.unit || "g"
              }
            });
          }
        }
      }

      // 3. Create the order record
      const newOrder = await tx.order.create({
        data: {
          userId: userSession.id,
          totalAmount: parseFloat(totalAmount),
          status: "PENDING",
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: parseFloat(item.quantity), // in base units
              price: parseFloat(item.price), // price per base unit
              unit: item.unit || "g", // ordered unit, e.g. "kg", "g", "L", "mL"
              subtotal: parseFloat(item.price) * parseFloat(item.quantity), // price * quantity
            })),
          },
        },
      });

      // 4. Decrement stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: parseFloat(item.quantity)
            }
          }
        });
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Prisma error creating order:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
