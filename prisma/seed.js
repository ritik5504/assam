/**
 * Prisma Seed Script — Admin Account Provisioning
 *
 * This script creates the predefined Admin account for AssamEdChem.
 *
 * SECURITY DESIGN:
 *  - Admin accounts are NEVER created through the registration page.
 *  - Only a system administrator with database access can run this script.
 *  - This is the ONLY authorised way to create an ADMIN account.
 *  - Uses upsert() — safe to run multiple times without creating duplicates.
 *
 * Usage:
 *   npx prisma db seed
 *
 * Or directly:
 *   node prisma/seed.js
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── Seed Admin Account ──────────────────────────────────────────────────
  /**
   * ADMIN ACCOUNT
   *
   * Email:    admin@test.com
   * Password: admin123  (stored as bcrypt hash — never in plaintext)
   * Role:     ADMIN
   *
   * This account has full access to:
   *  - Create, edit, delete products
   *  - View all orders (all users)
   *  - Approve, reject, complete orders
   *  - Manage inventory stock
   */
  const adminPasswordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {
      // If admin already exists, ensure role is correct (idempotent fix)
      role: "ADMIN",
      name: "Admin",
    },
    create: {
      name: "Admin",
      email: "admin@test.com",
      password: adminPasswordHash,
      role: "ADMIN", // ← Hardcoded. Admin accounts ONLY come from here.
    },
  });

  console.log(`✅ Admin account ready:`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role:  ${admin.role}`);
  console.log(`   ID:    ${admin.id}\n`);

  console.log("🔐 Security Reminders:");
  console.log("   • Change the admin password after first login in production.");
  console.log("   • Admin accounts are ONLY created via this seed script.");
  console.log("   • Registration page always assigns role = USER.");
  console.log("   • Users cannot self-promote to ADMIN.\n");

  console.log("✨ Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
