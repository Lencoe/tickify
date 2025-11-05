import pool from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export const createUser = async (
  role: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone?: string
) => {
  const hashed = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO users (id, role, first_name, last_name, email, password_hash, phone)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, role, firstName, lastName, email, hashed, phone]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [email]);
  return result.rows[0];
};
