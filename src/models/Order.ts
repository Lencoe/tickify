// src/models/Order.ts
import pool from '../config/db';

export interface Order {
  id?: string;
  customer_id: string;
  merchant_id: string;
  total_amount_cents: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_provider?: string;
  payment_reference?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const OrderModel = {
  // 🔹 Create new order
  async create(order: Order) {
    const query = `
      INSERT INTO orders (
        customer_id, merchant_id, total_amount_cents, currency, status, payment_provider, payment_reference
      )
      VALUES ($1, $2, $3, COALESCE($4, 'ZAR'), COALESCE($5, 'pending'), $6, $7)
      RETURNING *;
    `;
    const values = [
      order.customer_id,
      order.merchant_id,
      order.total_amount_cents,
      order.currency,
      order.status,
      order.payment_provider,
      order.payment_reference,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  // 🔹 Find order by ID
  async findById(orderId: string) {
    const query = `SELECT * FROM orders WHERE id = $1;`;
    const { rows } = await pool.query(query, [orderId]);
    return rows[0];
  },

  // 🔹 Get all orders
  async findAll() {
    const query = `
      SELECT o.*, u.first_name, u.last_name, m.company_name
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      LEFT JOIN merchants m ON o.merchant_id = m.id
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  // 🔹 Find all orders by customer
  async findByCustomer(customerId: string) {
    const query = `
      SELECT o.*, m.company_name 
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.id
      WHERE o.customer_id = $1
      ORDER BY o.created_at DESC;
    `;
    const { rows } = await pool.query(query, [customerId]);
    return rows;
  },

  // 🔹 Update order status
  async updateStatus(orderId: string, status: string) {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, orderId]);
    return rows[0];
  },
};
