import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";

export async function createCategory(data, userId = null) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || undefined,
      },
    });

    // audit
    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        entity: "Category",
        entityId: category.id,
        newValues: category,
        userId: userId || null,
      },
    });

    return category;
  } catch (err) {
    if (err?.code === "P2002") {
      throw new ResponseError(409, "Category already exists");
    }
    throw err;
  }
}

export default { createCategory };

export async function listCategories({ page = 1, limit = 10, search } = {}) {
  const skip = (page - 1) * limit;
  const where = { isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pages = Math.ceil(total / limit) || 1;

  return { items, meta: { total, page, limit, pages } };
}

export async function updateCategory(id, payload, userId = null) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ResponseError(404, "Category not found");

  const data = {};
  if (typeof payload.name !== "undefined") data.name = payload.name;
  if (typeof payload.description !== "undefined")
    data.description = payload.description;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.category.update({ where: { id }, data });

    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        entity: "Category",
        entityId: id,
        oldValues: existing,
        newValues: updated,
        userId: userId || null,
      },
    });

    return updated;
  });

  return result;
}

export async function deleteCategory(id, userId = null) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ResponseError(404, "Category not found");

  const result = await prisma.$transaction(async (tx) => {
    const deleted = await tx.category.update({
      where: { id },
      data: { isDeleted: true },
    });

    await tx.auditLog.create({
      data: {
        action: "DELETE",
        entity: "Category",
        entityId: id,
        oldValues: existing,
        newValues: deleted,
        userId: userId || null,
      },
    });

    return deleted;
  });

  return result;
}

export async function getCategoryById(
  id,
  { page = 1, limit = 10, search } = {}
) {
  // validate category exists first
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new ResponseError(404, "Category not found");

  const skip = (page - 1) * limit;
  const where = { categoryId: id, isDeleted: false };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { images: true },
    }),
  ]);

  const pages = Math.ceil(total / limit) || 1;

  const productIds = items.map((i) => i.id);
  const sums = productIds.length
    ? await prisma.productBatch.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { productId: { in: productIds } },
      })
    : [];

  const sumMap = new Map(sums.map((s) => [s.productId, s._sum.quantity || 0]));

  const itemsWithQuantity = items.map((it) => ({
    ...it,
    totalQuantity: sumMap.get(it.id) || 0,
  }));

  return {
    category,
    products: itemsWithQuantity,
    meta: { total, page, limit, pages },
  };
}
