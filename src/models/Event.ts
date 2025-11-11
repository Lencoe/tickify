import pool from "../config/db";

export interface Event {
  id?: string;
  merchant_id: string;
  title: string;
  description?: string;
  category: "concert" | "sports" | "theatre" | "comedy" | "festival" | "conference";
  venue_name?: string;
  venue_address?: string;
  start_datetime: string;
  end_datetime: string;
  age_restriction?: number;
  image_url?: string;
  status?: "draft" | "published" | "cancelled";
  created_at?: Date;
  updated_at?: Date;
}

export const createEventTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) CHECK (category IN ('concert','sports','theatre','comedy','festival','conference')) NOT NULL,
      venue_name VARCHAR(255),
      venue_address TEXT,
      start_datetime TIMESTAMP NOT NULL,
      end_datetime TIMESTAMP NOT NULL,
      age_restriction INTEGER,
      image_url TEXT,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
};
