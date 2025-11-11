import pool from "../config/db.js";

export interface Order {
  id?: number;
  user_id: number;
  total_amount: number;
  status?: string; // pending, paid, refunded
  created_at?: Date;
}

export const OrderModel = {
  async create(order: Order) {
    const result = await pool.query(
      `INSERT INTO orders (user_id, total_amount, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [order.user_id, order.total_amount, order.status || "pending"]
    );
    return result.rows[0];
  },

  async findById(orderId: number) {
    const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    return result.rows[0];
  },

  async findByUser(userId: number) {
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async updateStatus(orderId: number, status: string) {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    return result.rows[0];
  },
};
