import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * ======================
 * CREATE EVENT (Merchant Only)
 * ======================
 */
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, date, venue } = req.body;

  if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Only merchants can create events' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO events (merchant_id, title, date, venue) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, title, date, venue]
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

/**
 * ======================
 * GET ALL EVENTS (Public)
 * ======================
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT e.*, u.name AS merchant_name FROM events e JOIN users u ON e.merchant_id = u.id ORDER BY date DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

/**
 * ======================
 * GET SINGLE EVENT BY ID
 * ======================
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT e.*, u.name AS merchant_name FROM events e JOIN users u ON e.merchant_id = u.id WHERE e.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

/**
 * ======================
 * UPDATE EVENT (Merchant Only)
 * ======================
 */
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, date, venue } = req.body;

  try {
    // Check ownership
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found' });

    const event = existing.rows[0];
    if (req.user.role !== 'merchant' || event.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: Only owning merchant can update' });
    }

    const result = await pool.query(
      'UPDATE events SET title = $1, date = $2, venue = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [title || event.title, date || event.date, venue || event.venue, id]
    );

    res.json({ event: result.rows[0] });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

/**
 * ======================
 * DELETE EVENT (Merchant Only)
 * ======================
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Check ownership
    const existing = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ message: 'Event not found' });

    const event = existing.rows[0];
    if (req.user.role !== 'merchant' || event.merchant_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: Only owning merchant can delete' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

export default router;
