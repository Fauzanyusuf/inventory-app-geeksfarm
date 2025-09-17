#!/usr/bin/env node
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function getOrCreateRole(name) {
  let role = await prisma.role.findFirst({ where: { name } });
  if (!role) {
    role = await prisma.role.create({ data: { name } });
  }
  return role;
}

async function getOrCreatePermission(accessKey) {
  // AccessPermission.accessKey is not unique in schema, so use findFirst
  let perm = await prisma.accessPermission.findFirst({ where: { accessKey } });
  if (!perm) {
    perm = await prisma.accessPermission.create({ data: { accessKey } });
  }
  return perm;
}

async function assignPermissionsToRole(roleId, permIds) {
  const roleWithPerms = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: true },
  });
  const existingIds = new Set(
    (roleWithPerms?.permissions || []).map((p) => p.id)
  );
  const toConnect = permIds
    .filter((id) => !existingIds.has(id))
    .map((id) => ({ id }));
  if (toConnect.length === 0) return;
  await prisma.role.update({
    where: { id: roleId },
    data: { permissions: { connect: toConnect } },
  });
}

async function main() {
  console.log("Starting seed...");

  // Roles
  const superAdminRole = await getOrCreateRole("SUPER_ADMIN");
  const adminRole = await getOrCreateRole("ADMIN");
  const staffRole = await getOrCreateRole("STAFF");

  // Permissions (examples)
  const perms = [
    "user:read",
    "user:manage",
    "product:read",
    "product:manage",
    "inventory:read",
    "inventory:manage",
    "report:read",
  ];

  const createdPerms = [];
  for (const p of perms) {
    const perm = await getOrCreatePermission(p);
    createdPerms.push(perm);
  }

  // Attach some permissions to roles (only missing ones will be connected)
  await assignPermissionsToRole(
    superAdminRole.id,
    createdPerms.map((p) => p.id)
  );
  await assignPermissionsToRole(
    adminRole.id,
    createdPerms
      .filter((p) =>
        [
          "product:read",
          "product:manage",
          "inventory:read",
          "inventory:manage",
          "report:read",
        ].includes(p.accessKey)
      )
      .map((p) => p.id)
  );
  await assignPermissionsToRole(
    staffRole.id,
    createdPerms
      .filter((p) => ["product:read", "inventory:read"].includes(p.accessKey))
      .map((p) => p.id)
  );

  // Create or update users for roles: SUPER_ADMIN, ADMIN, STAFF
  async function createOrUpdateUser({ email, name, roleId, password }) {
    const hash = await bcrypt.hash(password, 10);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { name, password: hash, roleId, isVerified: true },
      });
      return existing;
    }
    return prisma.user.create({
      data: { name, email, password: hash, roleId, isVerified: true },
    });
  }

  const superAdminEmail =
    process.env.SEED_SUPERADMIN_EMAIL || "superadmin@example.com";
  const superAdminPassword =
    process.env.SEED_SUPERADMIN_PASSWORD || "superpassword";
  await createOrUpdateUser({
    email: superAdminEmail,
    name: "Super Admin",
    roleId: superAdminRole.id,
    password: superAdminPassword,
  });

  const adminUserEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminUserPassword = process.env.SEED_ADMIN_PASSWORD || "password123";
  await createOrUpdateUser({
    email: adminUserEmail,
    name: "Admin User",
    roleId: adminRole.id,
    password: adminUserPassword,
  });

  const staffEmail = process.env.SEED_STAFF_EMAIL || "staff@example.com";
  const staffPassword = process.env.SEED_STAFF_PASSWORD || "staffpassword";
  await createOrUpdateUser({
    email: staffEmail,
    name: "Staff User",
    roleId: staffRole.id,
    password: staffPassword,
  });

  // Sample categories
  let cat1 = await prisma.category.findFirst({
    where: { name: "Electronics" },
  });
  if (!cat1)
    cat1 = await prisma.category.create({
      data: { name: "Electronics", description: "Electronic items" },
    });
  let cat2 = await prisma.category.findFirst({ where: { name: "Groceries" } });
  if (!cat2)
    cat2 = await prisma.category.create({
      data: { name: "Groceries", description: "Everyday groceries" },
    });

  // Sample product
  let product = await prisma.product.findFirst({
    where: { name: "Sample Widget" },
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: "Sample Widget",
        description: "A sample product",
        sellingPrice: BigInt(10000),
        categoryId: cat1.id,
      },
    });
  } else {
    await prisma.product.update({
      where: { id: product.id },
      data: { description: "Updated sample widget" },
    });
  }

  // Product batch (create one sample batch for the product if none exists)
  const existingBatch = await prisma.productBatch.findFirst({
    where: { productId: product.id },
  });
  if (!existingBatch) {
    await prisma.productBatch.create({
      data: { productId: product.id, quantity: 100, costPrice: BigInt(8000) },
    });
  }

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
