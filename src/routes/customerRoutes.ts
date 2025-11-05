import express from 'express';
import { getTickets, buyTicket } from '../controllers/customer/customerController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = express.Router();

// Customer routes
router.get('/tickets', authenticateJWT, requireRole('customer'), getTickets);
router.post('/tickets/buy', authenticateJWT, requireRole('customer'), buyTicket);

export default router;
