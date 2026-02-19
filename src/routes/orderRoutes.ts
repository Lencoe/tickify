// src/routes/orderRoutes.ts
import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from "../controllers/orderController";

const router = express.Router();

//  Customer creates an order (buy tickets)
router.post("/", authenticateJWT, requireRole("customer"), createOrder);

//  Get a single order (customer, merchant, or admin can view)
router.get("/:id",authenticateJWT, requireRole(["merchant", "admin"]),getOrderById);


//  Merchant/Admin can view all orders
router.get("/", authenticateJWT, requireRole(["merchant", "admin"]), getAllOrders);

//  Merchant/Admin can update order status (paid, refunded, cancelled)
router.patch("/:id/status", authenticateJWT, requireRole(["merchant", "admin"]), updateOrderStatus);

//  Customer or Merchant cancels an order
router.patch("/:id/cancel",  authenticateJWT, cancelOrder );

export default router;
