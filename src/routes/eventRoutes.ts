import express from "express";
import {
  getAllEvents,
  getEventById,
} from "../controllers/eventController";

const router = express.Router();

//  Public routes (no auth needed)
router.get("/", getAllEvents);
router.get("/:id", getEventById);

export default router;
