import pool from "../config/db";

export interface Merchant {
  id?: string;
  company_name: string;
  physical_address?: string;
  bank_account_details?: string;
  cipc_document_url?: string;
  id_document_url?: string;
  proof_of_residence_url?: string;
  proof_of_bank_url?: string;
  business_registration_number?: string;
  status?: "pending" | "verified" | "rejected";
  verification_notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createMerchantTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS merchants (
      id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(150) NOT NULL,
      physical_address TEXT,
      bank_account_details TEXT,
      cipc_document_url TEXT,
      id_document_url TEXT,
      proof_of_residence_url TEXT,
      proof_of_bank_url TEXT,
      business_registration_number VARCHAR(100),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
      verification_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};
