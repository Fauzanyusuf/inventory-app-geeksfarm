import {
  commitSalesSchema,
  getStockMovementsQuerySchema,
} from "../validation/stock-movement-validation.js";
import { validate } from "../validation/validate.js";
import stockMovementService from "../service/stock-movement-service.js";

async function commitSales(req, res, next) {
  try {
    const data = validate(commitSalesSchema, req.body);

    const result = await stockMovementService.commitSales(data);

    return res.status(201).json({
      data: result,
      message: "Sales committed successfully",
    });
  } catch (err) {
    next(err);
  }
}

async function getStockMovements(req, res, next) {
  try {
    const query = validate(getStockMovementsQuerySchema, req.query);

    const result = await stockMovementService.getStockMovements(query);

    return res.status(200).json({
      data: result.movements,
      meta: result.meta,
      message: "Stock movements retrieved successfully",
    });
  } catch (err) {
    next(err);
  }
}

export default { commitSales, getStockMovements };
