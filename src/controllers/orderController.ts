// src/controllers/orderController.ts
import { Request, Response } from "express";
import pool from "../config/db";

// ------------------------------------------
// 🟩 Create new order (Customer buys tickets)
// ------------------------------------------
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    const { items } = req.body;
    const customer_id = req.user!.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "No order items provided." });
      return;
    }

    await client.query("BEGIN");

    let total_amount_cents = 0;
    let merchant_id: string | null = null;

    // 🔍 Validate tickets & calculate totals
    for (const item of items) {
      const { ticket_type_id, quantity } = item;

      const ticketRes = await client.query(
        `
        SELECT tt.price_cents, tt.available_quantity, e.merchant_id
        FROM ticket_types tt
        JOIN events e ON tt.event_id = e.id
        WHERE tt.id = $1
        `,
        [ticket_type_id]
      );

      if (ticketRes.rows.length === 0) {
        throw new Error("Ticket type not found");
      }

      const ticket = ticketRes.rows[0];

      if (ticket.available_quantity < quantity) {
        throw new Error("Not enough tickets available");
      }

      merchant_id = ticket.merchant_id;
      total_amount_cents += ticket.price_cents * quantity;
    }

    // 🧾 Create order
    const orderResult = await client.query(
      `
      INSERT INTO orders (customer_id, merchant_id, total_amount_cents, currency)
      VALUES ($1, $2, $3, 'ZAR')
      RETURNING *
      `,
      [customer_id, merchant_id, total_amount_cents]
    );

    const order = orderResult.rows[0];

    // 📦 Insert order items + reduce stock
    for (const item of items) {
      const { ticket_type_id, quantity } = item;

      const ticketRes = await client.query(
        `SELECT price_cents FROM ticket_types WHERE id = $1`,
        [ticket_type_id]
      );

      const price_cents = ticketRes.rows[0].price_cents;

      await client.query(
        `
        INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price_cents)
        VALUES ($1, $2, $3, $4)
        `,
        [order.id, ticket_type_id, quantity, price_cents]
      );

      await client.query(
        `
        UPDATE ticket_types
        SET available_quantity = available_quantity - $1
        WHERE id = $2
        `,
        [quantity, ticket_type_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error creating order:", error);
    res.status(500).json({ message: error.message });
  } finally {
    client.release();
  }
};

// ------------------------------------------
// 🟨 Get a specific order by ID
// ------------------------------------------
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const orderRes = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const order = orderRes.rows[0];

    // 🔒 Authorization check
    if (
      user.role === "customer" && order.customer_id !== user.id ||
      user.role === "merchant" && order.merchant_id !== user.id
    ) {
      res.status(403).json({ message: "Unauthorized access to order" });
      return;
    }

    const itemsRes = await pool.query(
      `
      SELECT oi.*, tt.name AS ticket_name
      FROM order_items oi
      JOIN ticket_types tt ON oi.ticket_type_id = tt.id
      WHERE oi.order_id = $1
      `,
      [id]
    );

    res.json({
      order,
      items: itemsRes.rows,
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ message: "Failed to get order" });
  }
};

// ------------------------------------------
// 🟦 Get all orders (Merchant/Admin only)
// ------------------------------------------
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    let query = `SELECT * FROM orders`;
    const values: any[] = [];

    if (user.role === "merchant") {
      query += ` WHERE merchant_id = $1`;
      values.push(user.id);
    }

    query += ` ORDER BY created_at DESC`;

    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "Failed to get orders" });
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
      `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.json({
      message: "Order status updated successfully",
      order: rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
