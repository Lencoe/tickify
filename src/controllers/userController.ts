import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register user
export const registerUser = async (req: Request, res: Response) => {
  const { first_name, last_name, email, password, phone } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields: first_name, last_name, email, password' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (role, first_name, last_name, email, password_hash, phone, is_verified)
       VALUES ('customer', $1, $2, $3, $4, $5, FALSE) RETURNING id, role, email`,
      [first_name, last_name, email, password_hash, phone || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    return res.status(201).json({ message: 'User registered', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Login user
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

    // If the user is a merchant, ensure they've been verified before allowing login
    if (user.role === 'merchant') {
      // Check users.is_verified flag first
      if (!user.is_verified) {
        return res.status(403).json({ message: 'Merchant account pending verification' });
      }

      // Also check merchants.status in case verification is stored there
      const m = await pool.query('SELECT status FROM merchants WHERE id = $1', [user.id]);
      const merchant = m.rows[0];
      if (!merchant || merchant.status !== 'verified') {
        return res.status(403).json({ message: 'Merchant account not verified by admin' });
      }
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

    return res.status(200).json({ token, user: { id: user.id, role: user.role, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
