// src/services/orderCleanupService.ts

import pool from "../config/db";

export const cleanupExpiredOrders = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log(" Running expired order cleanup...");

    //  Find expired pending orders
    const expiredOrders = await client.query(
      `
      SELECT id
      FROM orders
      WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
      FOR UPDATE
      `
    );

    if (expiredOrders.rows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    for (const order of expiredOrders.rows) {
      const orderId = order.id;

      console.log(`Cleaning order: ${orderId}`);

      //  Restore ticket quantities
      const items = await client.query(
        `
        SELECT ticket_type_id, quantity
        FROM order_items
        WHERE order_id = $1
        `,
        [orderId]
      );

      for (const item of items.rows) {
        await client.query(
          `
          UPDATE ticket_types
          SET available_quantity = available_quantity + $1,
              updated_at = NOW()
          WHERE id = $2
          `,
          [item.quantity, item.ticket_type_id]
        );
      }

      //  Cancel order
      await client.query(
        `
        UPDATE orders
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = $1
        `,
        [orderId]
      );

      console.log(`Order expired and cancelled: ${orderId}`);
    }

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(" Cleanup error:", err);
  } finally {
    client.release();
  }
};
