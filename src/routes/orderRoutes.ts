import express from "express";
import { createOrder, getMyOrders, getOrderById } from "../controllers/orderController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js"; 

const router = express.Router();


router.post("/", authenticateJWT, createOrder);
router.get("/", authenticateJWT, getMyOrders);
router.get("/:orderId", authenticateJWT, getOrderById);

export default router;
