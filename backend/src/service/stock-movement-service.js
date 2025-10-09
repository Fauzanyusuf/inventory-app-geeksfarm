import { prisma } from "../application/database.js";
import { ResponseError } from "../utils/response-error.js";
import { logger } from "../application/logging.js";

async function commitSales({ sales, note }) {
	try {
		const results = await prisma.$transaction(async (tx) => {
			const transactionResults = [];

			for (const sale of sales) {
				const { productId, quantity } = sale;

				const product = await tx.product.findUnique({
					where: { id: productId, isDeleted: false },
					select: { id: true, name: true, isPerishable: true },
				});

				if (!product) {
					throw new ResponseError(404, `Product not found: ${productId}`);
				}

				const batches = await tx.productBatch.findMany({
					where: {
						productId,
						status: "AVAILABLE",
						quantity: { gt: 0 },
					},
					orderBy: product.isPerishable
						? [{ expiredAt: "asc" }, { id: "asc" }]
						: [{ createdAt: "asc" }, { id: "asc" }],
					select: {
						id: true,
						quantity: true,
						createdAt: true,
						expiredAt: true,
					},
				});

				if (batches.length === 0) {
					throw new ResponseError(
						400,
						`No available stock for product: ${product.name}`
					);
				}

				const totalAvailable = batches.reduce(
					(sum, batch) => sum + batch.quantity,
					0
				);
				if (totalAvailable < quantity) {
					throw new ResponseError(
						400,
						`Insufficient stock for ${product.name}. Available: ${totalAvailable}, Requested: ${quantity}`
					);
				}

				const movements = [];
				let remainingQuantity = quantity;

				for (const batch of batches) {
					if (remainingQuantity <= 0) break;

					const reduceQuantity = Math.min(remainingQuantity, batch.quantity);
					const newQty = batch.quantity - reduceQuantity;

					await tx.productBatch.update({
						where: { id: batch.id },
						data: {
							quantity: { decrement: reduceQuantity },
							status: getBatchStatus(batch.expiredAt, newQty),
						},
					});

					const movement = await tx.stockMovement.create({
						data: {
							productId,
							productBatchId: batch.id,
							quantity: reduceQuantity,
							movementType: "OUT",
							note: note || "Stock reduced via sales",
						},
						select: {
							id: true,
							quantity: true,
							movementType: true,
							note: true,
							createdAt: true,
							productBatch: {
								select: {
									id: true,
									expiredAt: true,
								},
							},
						},
					});

					movements.push(movement);
					remainingQuantity -= reduceQuantity;
				}

				transactionResults.push({
					product: { id: product.id, name: product.name },
					movements,
					totalReduced: quantity,
				});

				logger.info(
					`Stock OUT movement created for product ${productId}, quantity: ${quantity}`
				);
			}

			return transactionResults;
		});

		return {
			sales: results,
			totalProducts: sales.length,
			message: "Sales committed successfully",
		};
	} catch (error) {
		logger.error("Error committing sales:", error);
		throw error;
	}
}

function getBatchStatus(expiredAt, quantity) {
	const now = new Date();
	if (expiredAt && expiredAt <= now) return "EXPIRED";
	if (quantity <= 0) return "SOLD_OUT";
	return "AVAILABLE";
}

async function getStockMovements({
	productId,
	search,
	movementType,
	startDate,
	endDate,
	page = 1,
	limit = 10,
}) {
	try {
		const skip = (page - 1) * limit;
		const where = {};

		if (productId) {
			where.productId = productId;
		} else if (search) {
			where.product = {
				OR: [
					{ name: { contains: search, mode: "insensitive" } },
					{ barcode: { contains: search, mode: "insensitive" } },
				],
			};
		}

		if (movementType) {
			where.movementType = movementType;
		}

		if (startDate || endDate) {
			where.createdAt = {};

			if (startDate) {
				where.createdAt.gte = new Date(startDate);
			}

			if (endDate) {
				where.createdAt.lte = new Date(endDate);
			}
		}

		const [movements, total] = await Promise.all([
			prisma.stockMovement.findMany({
				where,
				include: {
					product: {
						select: {
							id: true,
							name: true,
							barcode: true,
						},
					},
					productBatch: {
						select: {
							id: true,
							expiredAt: true,
							status: true,
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.stockMovement.count({ where }),
		]);

		return {
			movements,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	} catch (error) {
		logger.error("Error getting stock movements:", error);
		throw new ResponseError(500, "Failed to retrieve stock movements");
	}
}

export default { commitSales, getStockMovements };
