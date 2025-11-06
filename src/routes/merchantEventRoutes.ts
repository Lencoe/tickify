import express from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import {
  createEvent,
  updateEvent,
  cancelEvent,
  getEvents,
  getEventReports,
} from "../controllers/merchantEventController";

const router = express.Router();

// Protect all merchant event routes
router.use(authenticateJWT, requireRole("merchant"));

// Event CRUD
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", cancelEvent);
router.get("/events", getEvents);

// Reports
router.get("/events/:id/reports", getEventReports);

export default router;
