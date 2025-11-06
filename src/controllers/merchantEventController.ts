import { Request, Response } from "express";
import pool from "../config/db";

// ✅ 1. Create a new event
export const createEvent = async (req: Request, res: Response) => {
  const merchantId = req.user?.id;
  const {
    title,
    description,
    category,
    venue_name,
    venue_address,
    start_datetime,
    end_datetime,
    age_restriction,
  } = req.body;

  if (!title || !category || !start_datetime || !end_datetime) {
    return res.status(400).json({
      message:
        "Missing required fields: title, category, start_datetime, end_datetime",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (
        merchant_id, title, description, category, venue_name, venue_address,
        start_datetime, end_datetime, age_restriction, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft')
      RETURNING *`,
      [
        merchantId,
        title,
        description,
        category,
        venue_name,
        venue_address,
        start_datetime,
        end_datetime,
        age_restriction || null,
      ]
    );

    res
      .status(201)
      .json({ message: "Event created successfully", event: result.rows[0] });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ 2. Update event
export const updateEvent = async (req: Request, res: Response) => {
  const merchantId = req.user?.id;
  const eventId = req.params.id;
  const updates = req.body;

  try {
    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE id=$1 AND merchant_id=$2",
      [eventId, merchantId]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setQuery = fields.map((f, i) => `${f}=$${i + 1}`).join(", ");

    const result = await pool.query(
      `UPDATE events SET ${setQuery}, updated_at=CURRENT_TIMESTAMP WHERE id=$${
        fields.length + 1
      } RETURNING *`,
      [...values, eventId]
    );

    res
      .status(200)
      .json({ message: "Event updated successfully", event: result.rows[0] });
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ 3. Cancel event
export const cancelEvent = async (req: Request, res: Response) => {
  const merchantId = req.user?.id;
  const eventId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE events SET status='cancelled', updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND merchant_id=$2 RETURNING *`,
      [eventId, merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found or unauthorized" });
    }

    res
      .status(200)
      .json({ message: "Event cancelled successfully", event: result.rows[0] });
  } catch (err) {
    console.error("Error cancelling event:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ 4. Get all merchant events (optional filter by category)
export const getEvents = async (req: Request, res: Response) => {
  const merchantId = req.user?.id;
  const category = req.query.category as string | undefined;

  try {
    let query = "SELECT * FROM events WHERE merchant_id=$1";
    const params: any[] = [merchantId];

    if (category) {
      query += " AND category=$2";
      params.push(category);
    }

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ 5. Generate report
export const getEventReports = async (req: Request, res: Response) => {
  const merchantId = req.user?.id;
  const eventId = req.params.id;

  try {
    const eventCheck = await pool.query(
      "SELECT * FROM events WHERE id=$1 AND merchant_id=$2",
      [eventId, merchantId]
    );
    if (eventCheck.rows.length === 0)
      return res.status(404).json({ message: "Event not found or unauthorized" });

    const salesResult = await pool.query(
      `SELECT SUM(oi.quantity) AS tickets_sold, 
              SUM(oi.quantity * oi.unit_price_cents) AS revenue_cents
       FROM order_items oi
       JOIN orders o ON oi.order_id=o.id
       WHERE o.merchant_id=$1 
         AND oi.ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id=$2)`,
      [merchantId, eventId]
    );

    const refundResult = await pool.query(
      `SELECT SUM(amount_cents) AS refunded_cents, COUNT(*) AS refund_count
       FROM refunds r
       JOIN orders o ON r.order_id=o.id
       WHERE o.merchant_id=$1 
         AND o.id IN (SELECT order_id FROM order_items WHERE ticket_type_id IN (SELECT id FROM ticket_types WHERE event_id=$2))`,
      [merchantId, eventId]
    );

    res.status(200).json({
      event: eventCheck.rows[0],
      tickets_sold: salesResult.rows[0].tickets_sold || 0,
      revenue_cents: salesResult.rows[0].revenue_cents || 0,
      refunded_cents: refundResult.rows[0].refunded_cents || 0,
      refund_count: refundResult.rows[0].refund_count || 0,
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
