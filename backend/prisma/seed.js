import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function CreateRole(name) {
	return await prisma.role.create({ data: { name } });
}

async function CreatePermission(accessKey) {
	return await prisma.accessPermission.create({ data: { accessKey } });
}

async function assignPermissionsToRole(roleId, permIds) {
	const roleWithPerms = await prisma.role.findUnique({
		where: { id: roleId },
		include: { permissions: true },
	});

	if (!roleWithPerms) {
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
}

async function createOrUpdateUser({ email, name, roleId, password }) {
	const hash = await bcrypt.hash(password, 10);
	return await prisma.user.create({
		data: { name, email, password: hash, roleId, isVerified: true },
	});
}

async function main() {
	await prisma.cart.deleteMany({});
	await prisma.order.deleteMany({});
	await prisma.address.deleteMany({});
	await prisma.stockMovement.deleteMany({});
	await prisma.productBatch.deleteMany({});
	await prisma.product.deleteMany({});
	await prisma.category.deleteMany({});
	await prisma.auditLog.deleteMany({});
	await prisma.image.deleteMany({});
	await prisma.user.deleteMany({});
	await prisma.role.deleteMany({});
	await prisma.accessPermission.deleteMany({});

	const superAdminRole = await CreateRole("SUPER_ADMIN");
	const adminRole = await CreateRole("ADMIN");
	const staffRole = await CreateRole("STAFF");

	const allPerms = [
		"user:read",
		"user:manage",
		"product:read",
		"product:manage",
		"inventory:read",
		"inventory:manage",
		"report:read",
	];

	const permIds = [];
	for (const permKey of allPerms) {
		const perm = await CreatePermission(permKey);
		permIds.push(perm.id);
	}

	await assignPermissionsToRole(superAdminRole.id, permIds);
	await assignPermissionsToRole(adminRole.id, [
		permIds[2],
		permIds[3],
		permIds[4],
		permIds[5],
		permIds[6],
	]); // product, inventory, report
	await assignPermissionsToRole(staffRole.id, [permIds[2], permIds[4]]); // product:read, inventory:read

	await createOrUpdateUser({
		email: "superadmin@example.com",
		name: "Super Admin",
		roleId: superAdminRole.id,
		password: "superpassword",
	});

	await createOrUpdateUser({
		email: "admin@example.com",
		name: "Admin User",
		roleId: adminRole.id,
		password: "adminpassword",
	});

	await createOrUpdateUser({
		email: "staff@example.com",
		name: "Staff User",
		roleId: staffRole.id,
		password: "staffpassword",
	});

	const categoryNames = [
		"Electronics",
		"Groceries",
		"Clothing",
		"Furniture",
		"Books",
		"Toys",
		"Beauty",
		"Sports",
		"Automotive",
		"Garden",
		"Office Supplies",
		"Health",
		"Pet Supplies",
		"Jewelry",
		"Music",
		"Tools",
		"Footwear",
		"Baby Products",
		"Food & Beverage",
		"Art",
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
}

main()
	.catch(() => {
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
