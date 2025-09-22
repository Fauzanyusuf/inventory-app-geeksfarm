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
  let perm = await prisma.accessPermission.findFirst({ where: { accessKey } });
  if (!perm) {
    perm = await prisma.accessPermission.create({ data: { accessKey } });
  }
  return perm;
}

async function assignPermissionsToRole(roleId, permIds) {
  try {
    const roleWithPerms = await prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    if (!roleWithPerms) {
      console.log(`Role with id ${roleId} not found, skipping permission assignment`);
      return;
    }

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
  } catch (error) {
    console.log(`Error assigning permissions to role ${roleId}:`, error.message);
  }
}

async function createOrUpdateUser({ email, name, roleId, password }) {
  try {
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
  } catch (error) {
    console.log(`Error creating user ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log("Starting seed...");

  // Jangan hapus User, Role, AccessPermission sesuai request
  // Jadi hanya hapus data dari model lain saja agar tidak duplicate
  await prisma.image.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.productBatch.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // Create roles and permissions if they don't exist
  console.log("Ensuring roles and permissions exist...");
  const superAdminRole = await getOrCreateRole("SUPER_ADMIN");
  const adminRole = await getOrCreateRole("ADMIN");
  const staffRole = await getOrCreateRole("STAFF");

  const allPerms = [
    "user:read", "user:manage", "product:read", "product:manage",
    "inventory:read", "inventory:manage", "report:read"
  ];

  const permIds = [];
  for (const permKey of allPerms) {
    const perm = await getOrCreatePermission(permKey);
    permIds.push(perm.id);
  }

  // Assign permissions to roles
  await assignPermissionsToRole(superAdminRole.id, permIds);
  await assignPermissionsToRole(adminRole.id, [permIds[2], permIds[3], permIds[4], permIds[5], permIds[6]]); // product, inventory, report
  await assignPermissionsToRole(staffRole.id, [permIds[2], permIds[4]]); // product:read, inventory:read

  // Create users if they don't exist
  console.log("Ensuring users exist...");
  await createOrUpdateUser({
    email: "superadmin@example.com",
    name: "Super Admin",
    roleId: superAdminRole.id,
    password: "superpassword"
  });

  await createOrUpdateUser({
    email: "admin@example.com",
    name: "Admin User",
    roleId: adminRole.id,
    password: "adminpassword"
  });

  await createOrUpdateUser({
    email: "staff@example.com",
    name: "Staff User",
    roleId: staffRole.id,
    password: "staffpassword"
  });

  // Get all users for seeding other data
  const users = await prisma.user.findMany({
    where: { isDeleted: false },
  });

  // --- Categories ---
  const categoryNames = [
    "Electronics", "Groceries", "Clothing", "Furniture", "Books",
    "Toys", "Beauty", "Sports", "Automotive", "Garden",
    "Office Supplies", "Health", "Pet Supplies", "Jewelry", "Music",
    "Tools", "Footwear", "Baby Products", "Food & Beverage", "Art"
  ];

  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.create({
      data: {
        name,
        description: `Description for ${name}`,
        isDeleted: false,
      },
    });
    categories.push(cat);
  }

  // --- Products ---
  const products = [];
  for (let i = 0; i < 20; i++) {
    const cat = categories[i % categories.length];
    const product = await prisma.product.create({
      data: {
        name: `Product ${i + 1}`,
        barcode: `BCODE${100000 + i}`,
        description: `This is the description for Product ${i + 1}`,
        unit: "pcs",
        sellingPrice: BigInt(10000 + i * 500),
        isPerishable: i % 2 === 0,
        isActive: true,
        isDeleted: false,
        categoryId: cat.id,
      },
    });
    products.push(product);
  }

  // --- Product Batches ---
  const batches = [];
  for (let i = 0; i < 20; i++) {
    const product = products[i % products.length];
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        quantity: 50 + i * 10,
        costPrice: BigInt(5000 + i * 200),
        status: "AVAILABLE",
        receivedAt: new Date(Date.now() - (i * 86400000)), // i days ago
        expiredAt: i % 2 === 0 ? new Date(Date.now() + ((i + 1) * 86400000)) : null,
      },
    });
    batches.push(batch);
  }

  // --- Stock Movements ---
  for (let i = 0; i < 20; i++) {
    const product = products[i % products.length];
    const batch = batches[i % batches.length];
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        productBatchId: batch.id,
        quantity: 10 + i,
        movementType: i % 3 === 0 ? "IN" : i % 3 === 1 ? "OUT" : "ADJUSTMENT",
        note: `Stock movement note for movement ${i + 1}`,
      },
    });
  }

  // --- Addresses ---
  const addresses = [];
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const address = await prisma.address.create({
      data: {
        label: `Home Address ${i + 1}`,
        fullAddress: `Jl. Example Street No. ${i + 1}`,
        subDistrict: `Subdistrict ${i + 1}`,
        district: `District ${i + 1}`,
        city: `City ${i + 1}`,
        province: `Province ${i + 1}`,
        country: "Indonesia",
        postalCode: `ID00${i + 1}0`,
        latitude: -6.2 + i * 0.01,
        longitude: 106.8 + i * 0.01,
        userId: user.id,
      },
    });
    addresses.push(address);
  }

  // --- Orders ---
  const orders = [];
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    const address = addresses[i % addresses.length];
    const courier = users[(i + 1) % users.length]; // another user as courier

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        courierId: courier.id,
        deliveryAddressId: address.id,
        paymentStatus: i % 4 === 0 ? "COMPLETED" : i % 4 === 1 ? "PENDING" : i % 4 === 2 ? "FAILED" : "REFUNDED",
        orderStatus: i % 5 === 0 ? "PAID" : i % 5 === 1 ? "PENDING" : i % 5 === 2 ? "SHIPPED" : i % 5 === 3 ? "COMPLETED" : "CANCELLED",
      },
    });
    orders.push(order);
  }

  // --- Order Items ---
  for (let i = 0; i < 20; i++) {
    const order = orders[i % orders.length];
    const product = products[i % products.length];
    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        quantity: (i % 5) + 1,
      },
    });
  }

  // --- Carts and Cart Items ---
  for (let i = 0; i < Math.min(users.length, 10); i++) {
    const user = users[i];
    const cart = await prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    // 1-5 items per cart
    for (let j = 0; j < 3; j++) {
      const product = products[(i + j) % products.length];
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: j + 1,
        },
      });
    }
  }

  // --- Images ---
  for (let i = 0; i < 20; i++) {
    const product = products[i % products.length];
    const category = categories[i % categories.length];
    const user = users[i % users.length];

    let data = {
      url: `https://example.com/images/${i + 1}.jpg`,
      thumbnailUrl: `https://example.com/images/thumbs/${i + 1}.jpg`,
      altText: `Image ${i + 1}`,
    };

    if (i % 3 === 0) {
      // Link to product
      data.productId = product.id;
    } else if (i % 3 === 1) {
      // Link to category using nested create
      data.category = { connect: { id: category.id } };
    } else {
      // Link to user using nested create
      data.user = { connect: { id: user.id } };
    }

    await prisma.image.create({ data });
  }

  // --- Audit Logs ---
  const auditActions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"];
  for (let i = 0; i < 20; i++) {
    const user = users[i % users.length];
    await prisma.auditLog.create({
      data: {
        action: auditActions[i % auditActions.length],
        entity: "Product",
        entityId: products[i % products.length].id,
        oldValues: null,
        newValues: null,
        userId: user.id,
      },
    });
  }

  console.log("Seed finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
