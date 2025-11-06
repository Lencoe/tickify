import express from 'express';
import { registerMerchant, getPendingMerchants, verifyMerchant } from '../controllers/merchantController';
import upload from '../middleware/uploadMiddleware';
import { authenticateJWT } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = express.Router();

// Public route: merchant registration
router.post(
  '/register',
  upload.fields([
    { name: 'id_document', maxCount: 1 },
    { name: 'proof_of_residence', maxCount: 1 },
    { name: 'proof_of_bank', maxCount: 1 },
    { name: 'cipc_document', maxCount: 1 }
  ]),
  registerMerchant
);

// Admin-only routes
router.get('/pending', authenticateJWT, requireRole('admin'), getPendingMerchants);
router.put('/:id/verify', authenticateJWT, requireRole('admin'), verifyMerchant);

export default router;
