// src/controllers/orderController.ts
import { Request, Response } from "express";
import pool from "../config/db";

// ------------------------------------------
// 🟩 Create new order (Customer buys tickets)
// ------------------------------------------
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { merchant_id, total_amount_cents, currency, items } = req.body;
    const customer_id = (req as any).user?.id; // from JWT

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "No order items provided." });
      return;
    }

    // ✅ Create the order
    const orderResult = await pool.query(
      `INSERT INTO orders (customer_id, merchant_id, total_amount_cents, currency)
       VALUES ($1, $2, $3, COALESCE($4, 'ZAR'))
       RETURNING *;`,
      [customer_id, merchant_id, total_amount_cents, currency]
    );
    const order = orderResult.rows[0];

    // ✅ Insert order items
    for (const item of items) {
      const { ticket_type_id, quantity, unit_price_cents } = item;

      await pool.query(
        `INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4);`,
        [order.id, ticket_type_id, quantity, unit_price_cents]
      );

      // 🔹 Decrease available tickets
      await pool.query(
        `UPDATE ticket_types 
         SET available_quantity = available_quantity - $1 
         WHERE id = $2 AND available_quantity >= $1;`,
        [quantity, ticket_type_id]
      );
    }

    res.status(201).json({
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ message: "Failed to create order", error });
  }
};

// ------------------------------------------
// 🟨 Get a specific order by ID
// ------------------------------------------
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT o.*, oi.ticket_type_id, oi.quantity, oi.unit_price_cents
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1;`,
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ message: "Failed to get order", error });
  }
};

// ------------------------------------------
// 🟦 Get all orders (Merchant/Admin only)
// ------------------------------------------
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    let query = `SELECT * FROM orders`;
    let values: any[] = [];

    if (user.role === "merchant") {
      query += ` WHERE merchant_id = $1`;
      values = [user.id];
    }

    query += ` ORDER BY created_at DESC;`;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Failed to get orders", error });
  }
};

// ------------------------------------------
// 🟥 Update order status (Merchant/Admin only)
// ------------------------------------------
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "cancelled", "refunded"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status." });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`,
      [status, id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.json({
      message: "Order status updated successfully.",
      order: rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status", error });
  }
};
