// src/models/TicketType.ts
import pool from '../config/db';

export interface TicketType {
  id?: string;
  event_id: string;
  name: string;
  price_cents: number;
  currency?: string;
  total_quantity: number;
  available_quantity: number;
  sales_start?: Date;
  sales_end?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export const TicketTypeModel = {
  // 🔹 Create a new ticket type
  async create(ticket: TicketType) {
    const query = `
      INSERT INTO ticket_types 
      (event_id, name, price_cents, currency, total_quantity, available_quantity, sales_start, sales_end)
      VALUES ($1, $2, $3, COALESCE($4, 'ZAR'), $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      ticket.event_id,
      ticket.name,
      ticket.price_cents,
      ticket.currency,
      ticket.total_quantity,
      ticket.available_quantity,
      ticket.sales_start,
      ticket.sales_end,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // 🔹 Get all tickets for a specific event
  async findByEvent(eventId: string) {
    const query = `SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY created_at ASC;`;
    const { rows } = await pool.query(query, [eventId]);
    return rows;
  },

  // 🔹 Find one ticket by ID
  async findById(ticketId: string) {
    const query = `SELECT * FROM ticket_types WHERE id = $1;`;
    const { rows } = await pool.query(query, [ticketId]);
    return rows[0];
  },

  // 🔹 Update ticket details
  async update(ticketId: string, updates: Partial<TicketType>) {
    const fields = Object.keys(updates);
    const values = Object.values(updates);

    if (fields.length === 0) return null;

    const setClause = fields.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const query = `
      UPDATE ticket_types 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $${fields.length + 1}
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [...values, ticketId]);
    return rows[0];
  },

  // 🔹 Delete a ticket type
  async delete(ticketId: string) {
    const query = `DELETE FROM ticket_types WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [ticketId]);
    return rows[0];
  },
};
