import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import {
  createEvent,
  updateEvent,
  cancelEvent,
  getEvents,
  getEventReports
} from '../controllers/merchantController';

const router = express.Router();

// All merchant routes require JWT and role='merchant'
router.use(authenticateJWT, requireRole('merchant'));

// Event management
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', cancelEvent);
router.get('/events', getEvents);

// Reports
router.get('/events/:id/reports', getEventReports);

export default router;
