import { Router, Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// ======================
// SIGNUP ROUTE
// ======================
router.post('/', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // 1️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2️⃣ Save user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];

    // 3️⃣ Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// ======================
// LOGIN ROUTE
// ======================
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: '1h' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// ======================
// PROTECTED ROUTE (Any Logged-In User)
// ======================
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users');
    res.json(result.rows);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// ======================
// ADMIN-ONLY ROUTE
// ======================
router.get('/admin', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admins only' });
  }

  res.json({ message: `Welcome Admin ${req.user.email}` });
});

export default router;
