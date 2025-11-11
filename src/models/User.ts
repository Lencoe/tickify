import pool from "../config/db";

export interface User {
  id?: string;
  role: "admin" | "merchant" | "customer";
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone?: string;
  id_number?: string;
  address?: string;
  is_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export const createUserTable = async () => {
  const query = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role VARCHAR(20) CHECK (role IN ('admin', 'merchant', 'customer')) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone VARCHAR(20),
      id_number VARCHAR(20),
      address TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};
