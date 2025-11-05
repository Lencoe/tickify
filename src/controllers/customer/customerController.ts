import { Request, Response } from 'express';
import pool from '../../config/db';
import bcrypt from 'bcryptjs';

// Get all tickets for a customer
export const getTickets = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT o.*, oi.*, tt.name AS ticket_name, e.title AS event_title
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN ticket_types tt ON oi.ticket_type_id = tt.id
       JOIN events e ON tt.event_id = e.id
       WHERE o.customer_id = $1`,
      [req.user?.id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Customer buys ticket
export const buyTicket = async (req: Request, res: Response) => {
  const { ticket_type_id, quantity } = req.body;
  if (!ticket_type_id || !quantity) {
    return res.status(400).json({ message: 'Missing ticket_type_id or quantity' });
  }

  try {
    const client = await pool.connect();
    await client.query('BEGIN');

    const ticket = await client.query('SELECT * FROM ticket_types WHERE id = $1', [ticket_type_id]);
    if (ticket.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ticket type not found' });
    }

    const availableQuantity = ticket.rows[0].available_quantity;
    if (quantity > availableQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    const totalAmount = quantity * ticket.rows[0].price_cents;

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, merchant_id, total_amount_cents)
       VALUES ($1, $2, $3) RETURNING id`,
      [req.user?.id, ticket.rows[0].merchant_id, totalAmount]
    );

    // Insert order items
    await client.query(
      `INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price_cents)
       VALUES ($1, $2, $3, $4)`,
      [orderResult.rows[0].id, ticket_type_id, quantity, ticket.rows[0].price_cents]
    );

    // Update ticket available quantity
    await client.query(
      `UPDATE ticket_types SET available_quantity = available_quantity - $1 WHERE id = $2`,
      [quantity, ticket_type_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Tickets purchased successfully', orderId: orderResult.rows[0].id });
  } catch (err) {
    console.error('Error purchasing tickets:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
