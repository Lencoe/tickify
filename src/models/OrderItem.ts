import pool from "../config/db.js";

export interface OrderItem {
  id?: number;
  order_id: number;
  ticket_type_id: number;
  quantity: number;
  price: number;
}

export const OrderItemModel = {
  async create(item: OrderItem) {
    const result = await pool.query(
      `INSERT INTO order_items (order_id, ticket_type_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [item.order_id, item.ticket_type_id, item.quantity, item.price]
    );
    return result.rows[0];
  },

  async findByOrder(orderId: number) {
    const result = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    return result.rows;
  },
};
