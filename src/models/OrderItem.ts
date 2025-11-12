// src/models/OrderItem.ts
import pool from '../config/db';

export interface OrderItem {
  id?: string;
  order_id: string;
  ticket_type_id: string;
  quantity: number;
  unit_price_cents: number;
  qr_code_data?: string;
  ticket_status?: 'valid' | 'used' | 'refunded';
  created_at?: Date;
}

export const OrderItemModel = {
  // 🔹 Create new order item
  async create(item: OrderItem) {
    const query = `
      INSERT INTO order_items (
        order_id, ticket_type_id, quantity, unit_price_cents, qr_code_data, ticket_status
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'valid'))
      RETURNING *;
    `;
    const values = [
      item.order_id,
      item.ticket_type_id,
      item.quantity,
      item.unit_price_cents,
      item.qr_code_data || null,
      item.ticket_status,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // 🔹 Get all items by order
  async findByOrder(orderId: string) {
    const query = `
      SELECT oi.*, tt.name AS ticket_name, e.title AS event_title
      FROM order_items oi
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      JOIN events e ON tt.event_id = e.id
      WHERE oi.order_id = $1;
    `;
    const { rows } = await pool.query(query, [orderId]);
    return rows;
  },
};
