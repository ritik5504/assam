/**
 * Prisma Seed Script — Admin Account Provisioning
 *
 * SECURITY DESIGN:
 *  - Admin accounts are NEVER created through the registration page.
 *  - Only a system administrator with database access can run this script.
 *  - This is the ONLY authorised way to create an ADMIN account.
 *  - Uses upsert() — safe to run multiple times without creating duplicates.
 *
 * Usage:
 *   npm run seed
 *   node prisma/seed.cjs
 *
 * Or via Prisma CLI:
 *   npx prisma db seed
 */

// Load environment variables from .env
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaNeon } = require("@prisma/adapter-neon");
const { neonConfig } = require("@neondatabase/serverless");
const ws = require("ws");
const bcrypt = require("bcryptjs");

// Configure WebSocket for Neon serverless connection in Node.js
neonConfig.webSocketConstructor = ws;

// Build PrismaClient with Neon adapter (same as src/lib/prisma.js)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...\n");

  /**
   * ADMIN ACCOUNT
   *
   * Email:    admin@test.com
   * Password: admin123  (stored as bcrypt hash — never in plaintext)
   * Role:     ADMIN
   *
   * Permissions:
   *  ✅ Create, edit, delete products
   *  ✅ View all orders (all users)
   *  ✅ Approve, reject, complete orders
   *  ✅ Manage inventory stock
   *
   * Normal USER Restrictions:
   *  ❌ Cannot access /admin routes (blocked by middleware)
   *  ❌ Cannot call admin API endpoints (blocked by requireAdmin guard)
   *  ❌ Cannot self-promote role to ADMIN via registration or API
   */
  const adminPasswordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      // If the admin already exists, ensure the role is correctly set (idempotent)
      role: "ADMIN",
      name: "Admin",
    },
    create: {
      name: "Admin",
      email: "admin@test.com",
      password: adminPasswordHash,
      role: "ADMIN", // ← Only this script can assign ADMIN role
    },
  });

  console.log("✅ Admin account ready:");
  console.log(`   Email:    ${admin.email}`);
  console.log(`   Password: admin123`);
  console.log(`   Role:     ${admin.role}`);
  console.log(`   ID:       ${admin.id}\n`);

  console.log("🔐 Security Reminders:");
  console.log("   • Change the admin password after first login in production.");
  console.log("   • Admin accounts are ONLY created via this seed script.");
  console.log("   • Registration page always assigns role = USER.");
  console.log("   • Users cannot self-promote to ADMIN via any API or URL.\n");

  console.log("✨ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
