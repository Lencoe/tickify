import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

import { getTickets, buyTicket } from "../controllers/customer/customerController";
import {
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../controllers/customer/customerOrdersController";
import { getMyPayments } from "../controllers/customer/customerPaymentsController";

const router = express.Router();

// 🎟 Tickets
router.get("/tickets", authenticateJWT, requireRole("customer"), getTickets);
router.post("/tickets/buy", authenticateJWT, requireRole("customer"), buyTicket);

// 📦 Orders
router.get("/orders", authenticateJWT, requireRole("customer"), getMyOrders);
router.get("/orders/:id", authenticateJWT, requireRole("customer"), getMyOrderById);
router.post("/orders/:id/cancel", authenticateJWT, requireRole("customer"), cancelMyOrder);

// 💳 Payments
router.get("/payments", authenticateJWT, requireRole("customer"), getMyPayments);

export default router;
