import { Request, Response } from "express";
import pool from "../config/db";

// ---------------------------------------------------
// 1️⃣ Get ALL published events (PUBLIC & CUSTOMER)
// ---------------------------------------------------
export const getAllEvents = async (req: Request, res: Response) => {
  const { category, search } = req.query;

  try {
    let query = `
      SELECT
        e.id,
        e.title,
        e.description,
        e.category,
        e.venue_name,
        e.venue_address,
        e.start_datetime,
        e.end_datetime,
        e.age_restriction,
        m.business_name AS merchant_name
      FROM events e
      JOIN merchants m ON e.merchant_id = m.id
      WHERE e.status = 'published'
        AND e.start_datetime > NOW()
    `;

    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND e.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND e.title ILIKE $${params.length}`;
    }

    query += " ORDER BY e.start_datetime ASC";

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// ---------------------------------------------------
// 2️⃣ Get SINGLE published event by ID
// ---------------------------------------------------
export const getEventById = async (req: Request, res: Response) => {
  const eventId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT
        e.*,
        m.business_name AS merchant_name
      FROM events e
      JOIN merchants m ON e.merchant_id = m.id
      WHERE e.id = $1
        AND e.status = 'published'
      `,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: "Failed to fetch event" });
  }
};
