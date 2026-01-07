// src/routes/payfastRoutes.ts
import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import {
  initiatePayment,
  payfastNotify,
  payfastSuccess,
  payfastCancel,
} from "../controllers/payfastController";

const router = express.Router();

// Customer initiates payment
router.post(
  "/initiate",
  authenticateJWT,
  requireRole("customer"),
  initiatePayment
);

// PayFast IPN (server → server)
router.post("/notify", payfastNotify);

// Redirect URL after payment
router.get("/success", payfastSuccess);
router.get("/cancel", payfastCancel);

export default router;
