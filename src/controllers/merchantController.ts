import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';

// -----------------------------
// 1️⃣ Register a new merchant
// -----------------------------
export const registerMerchant = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      id_number,
      address,
      company_name,
      physical_address,
      bank_account_details,
      business_registration_number
    } = req.body;

    // Uploaded files (via Multer)
    const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };

    const cipc_document_url = uploadedFiles?.cipc_document
      ? `/uploads/${uploadedFiles.cipc_document[0].filename}`
      : null;

    const id_document_url = uploadedFiles?.id_document
      ? `/uploads/${uploadedFiles.id_document[0].filename}`
      : null;

    const proof_of_residence_url = uploadedFiles?.proof_of_residence
      ? `/uploads/${uploadedFiles.proof_of_residence[0].filename}`
      : null;

    const proof_of_bank_url = uploadedFiles?.proof_of_bank
      ? `/uploads/${uploadedFiles.proof_of_bank[0].filename}`
      : null;

    // Check required fields
    if (!first_name || !last_name || !email || !password || !company_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await client.query('SELECT * FROM users WHERE email=$1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction
    await client.query('BEGIN');

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (
        role, first_name, last_name, email, password_hash, phone, id_number, address, is_verified
      ) VALUES ('merchant', $1,$2,$3,$4,$5,$6,$7,FALSE) RETURNING id`,
      [first_name, last_name, email, hashedPassword, phone||null, id_number||null, address||null]
    );
    const userId = userResult.rows[0].id;

    // Insert merchant details
    await client.query(
      `INSERT INTO merchants (
        id, company_name, physical_address, bank_account_details, cipc_document_url,
        id_document_url, proof_of_residence_url, proof_of_bank_url, business_registration_number, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [userId, company_name, physical_address||null, bank_account_details||null, cipc_document_url,
        id_document_url, proof_of_residence_url, proof_of_bank_url, business_registration_number||null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Merchant registered successfully. Awaiting verification by admin.',
      merchant_id: userId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering merchant:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

// -----------------------------
// 2️⃣ Get all pending merchants (Admin only)
// -----------------------------
export const getPendingMerchants = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.email, u.phone
       FROM merchants m
       JOIN users u ON m.id=u.id
       WHERE m.status='pending'`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching pending merchants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// -----------------------------
// 3️⃣ Verify or reject merchant (Admin only)
// -----------------------------
export const verifyMerchant = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, verification_notes } = req.body;

    if (!['verified','rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'verified' or 'rejected'" });
    }

    await client.query('BEGIN');

    await client.query(
      `UPDATE merchants SET status=$1, verification_notes=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3`,
      [status, verification_notes||null, id]
    );

    if (status === 'verified') {
      await client.query(`UPDATE users SET is_verified=TRUE WHERE id=$1`, [id]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: `Merchant ${status} successfully.` });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating merchant status:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};
