import { Request, Response } from "express";
import pool from "../../config/db";

/**
 * GET /api/customer/orders
 * Customer views all their orders
 */
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const customerId = req.user!.id;

    const { rows } = await pool.query(
      `SELECT *
       FROM orders
       WHERE customer_id = $1
       ORDER BY created_at DESC`,
      [customerId]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching customer orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * GET /api/customer/orders/:id
 * Customer views a single order (OWNERSHIP ENFORCED)
 */
export const getMyOrderById = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { id } = req.params;

  const { rows } = await pool.query(
    `SELECT o.*, oi.ticket_type_id, oi.quantity, oi.unit_price_cents
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1 AND o.customer_id = $2`,
    [id, customerId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  res.json(rows);
};

/**
 * POST /api/customer/orders/:id/cancel
 * Customer cancels pending order
 */
export const cancelMyOrder = async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const { id } = req.params;

  const { rowCount } = await pool.query(
    `UPDATE orders
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1
       AND customer_id = $2
       AND status = 'pending'`,
    [id, customerId]
  );

  if (rowCount === 0) {
    return res.status(400).json({
      message: "Order cannot be cancelled",
    });
  }

  res.json({ message: "Order cancelled successfully" });
};
