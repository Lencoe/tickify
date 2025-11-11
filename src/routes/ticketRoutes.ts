import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  createTicketType,
  getTicketsByEvent,
  updateTicketType,
  deleteTicketType,
} from '../controllers/ticketController';

const router = express.Router();

/**
 * @route   POST /api/tickets
 * @desc    Create a new ticket type (Merchant only)
 */
router.post('/', authenticateJWT, requireRole('merchant'), createTicketType);

/**
 * @route   GET /api/tickets/:eventId
 * @desc    Get all ticket types for a specific event (Public)
 */
router.get('/:eventId', getTicketsByEvent);

/**
 * @route   PUT /api/tickets/:ticketId
 * @desc    Update ticket type details (Merchant only)
 */
router.put('/:ticketId', authenticateJWT, requireRole('merchant'), updateTicketType);

/**
 * @route   DELETE /api/tickets/:ticketId
 * @desc    Delete a ticket type (Merchant only)
 */
router.delete('/:ticketId', authenticateJWT, requireRole('merchant'), deleteTicketType);

export default router;
