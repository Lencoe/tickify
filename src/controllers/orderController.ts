import { Request, Response } from "express";
import { OrderModel } from "../models/Order.js";
import { OrderItemModel } from "../models/OrderItem.js";
import pool from "../config/db.js";

// Create an order (buy ticket)
export const createOrder = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { items } = req.body; 
    const user_id = (req as any).user?.id; // assume middleware sets req.user
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No tickets selected" });

    await client.query("BEGIN");

    let totalAmount = 0;
    for (const item of items) {
      const ticket = await client.query(
        `SELECT * FROM ticket_types WHERE id = $1`,
        [item.ticket_type_id]
      );

      if (ticket.rows.length === 0)
        throw new Error(`Ticket type ${item.ticket_type_id} not found`);

      const ticketData = ticket.rows[0];
      if (ticketData.available_quantity < item.quantity)
        throw new Error(`Not enough tickets available for ${ticketData.name}`);

      totalAmount += ticketData.price * item.quantity;

      // Deduct ticket stock
      await client.query(
        `UPDATE ticket_types SET available_quantity = available_quantity - $1 WHERE id = $2`,
        [item.quantity, item.ticket_type_id]
      );
    }

    // Create order
    const order = await OrderModel.create({
      user_id,
      total_amount: totalAmount,
      status: "pending",
    });

    // Create order items
    for (const item of items) {
      const ticket = await client.query(
        `SELECT price FROM ticket_types WHERE id = $1`,
        [item.ticket_type_id]
      );
      await OrderItemModel.create({
        order_id: order.id!,
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
        price: ticket.rows[0].price,
      });
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Order created", order });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Get all orders for logged-in customer
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.id;
    if (!user_id) return res.status(401).json({ message: "Unauthorized" });

    const orders = await OrderModel.findByUser(user_id);
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get order details
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const order = await OrderModel.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const items = await OrderItemModel.findByOrder(orderId);
    res.json({ ...order, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
