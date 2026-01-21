import { Request, Response } from "express";
import pool from "../../config/db";

/**
 * GET /api/customer/payments
 */
export const getMyPayments = async (req: Request, res: Response) => {
  const customerId = req.user!.id;

  const { rows } = await pool.query(
    `SELECT *
     FROM payments
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customerId]
  );

  res.json(rows);
};
