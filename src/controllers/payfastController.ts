// src/controllers/payfastController.ts
import { Request, Response } from "express";
import crypto from "crypto";
import pool from "../config/db";
import qs from "querystring";

// PayFast process URL (auto-switch sandbox / production)
const PF_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";

// ---------------------------------------------------
//  INITIATE PAYMENT (Customer → PayFast Redirect)
// ---------------------------------------------------
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;
    const customerId = req.user?.id;

    //  Validate input
    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    //  Fetch order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    //  Ownership check (customer can only pay their own order)
    if (order.customer_id !== customerId) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

  //  Only allow payment for pending orders
  if (order.status !== "pending") {
    return res.status(400).json({
      message: `Cannot pay an order with status '${order.status}'`,
    });
  }


    //  Create payment record BEFORE redirect
    const paymentResult = await pool.query(
      `
      INSERT INTO payments (
        order_id,
        customer_id,
        provider,
        merchant_reference,
        amount_cents,
        currency,
        status
      )
      VALUES ($1, $2, 'payfast', $3, $4, $5, 'initiated')
      RETURNING *
      `,
      [
        order.id,
        customerId,
        order.id, // m_payment_id
        order.total_amount_cents,
        order.currency,
      ]
    );

    //  Build PayFast payload
    const data: any = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: process.env.PAYFAST_RETURN_URL!,
      cancel_url: process.env.PAYFAST_CANCEL_URL!,
      notify_url: process.env.PAYFAST_NOTIFY_URL!,

      amount: (order.total_amount_cents / 100).toFixed(2),
      item_name: `Tickify Order ${order.id}`,
      m_payment_id: order.id,
    };

    //  Generate PayFast signature
    data.signature = generateSignature(
      data,
      process.env.PAYFAST_PASSPHRASE
    );

    //  Respond with redirect URL
    return res.status(200).json({
      message: "Payment initiated",
      payment_id: paymentResult.rows[0].id,
      redirect_url: `${PF_URL}?${qs.stringify(data)}`,
    });
  } catch (error) {
    console.error(" PayFast Initiation Error:", error);
    return res.status(500).json({ message: "Payment initiation failed" });
  }
};

// ---------------------------------------------------
//  PAYFAST IPN (SERVER → SERVER, HARDENED),payfastNotify()
// ---------------------------------------------------
export const payfastNotify = async (req: Request, res: Response) => {
  try {
    // Clone payload (PayFast sends form-urlencoded data)
    const payload = { ...req.body };
    const receivedSignature = payload.signature;

    // Required fields validation
    if (!payload.m_payment_id || !payload.payment_status || !receivedSignature) {
      return res.status(400).send("Invalid IPN");
    }

    // Remove signature before verification
    delete payload.signature;

    //  Verify PayFast signature
    const calculatedSignature = generateSignature(
      payload,
      process.env.PAYFAST_PASSPHRASE
    );

    if (receivedSignature !== calculatedSignature) {
      console.error("Invalid PayFast signature");
      return res.status(400).send("Invalid signature");
    }

    const orderId = payload.m_payment_id;

    //  Fetch order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(400).send("Order not found");
    }

    const order = orderResult.rows[0];

    //  Validate merchant ID (protect against spoofed IPN)
    if (payload.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      console.error(" Merchant ID mismatch");
      return res.status(400).send("Invalid merchant");
    }

    //  Validate amount (critical security check)
    const expectedAmount = (order.total_amount_cents / 100).toFixed(2);
    if (payload.amount_gross !== expectedAmount) {
      console.error(" Amount mismatch", payload.amount_gross, expectedAmount);
      return res.status(400).send("Invalid amount");
    }

    //  Fetch payment record
    const paymentResult = await pool.query(
      `
      SELECT * FROM payments
      WHERE merchant_reference = $1
        AND provider = 'payfast'
      `,
      [orderId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(400).send("Payment record not found");
    }

    const payment = paymentResult.rows[0];

    // Idempotency: ignore duplicate IPNs
    if (payment.status === "paid") {
      return res.status(200).send("Already processed");
    }

    const status = payload.payment_status;

    //  Handle SUCCESSFUL payment
    if (status === "COMPLETE") {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        //  Update payment
        await client.query(
          `
          UPDATE payments
          SET status = 'paid',
              provider_reference = $2,
              raw_notify_payload = $3,
              updated_at = NOW()
          WHERE id = $1
          `,
          [payment.id, payload.pf_payment_id, payload]
        );

        //  Update order
        await client.query(
          `
          UPDATE orders
          SET status = 'paid',
              payment_provider = 'payfast',
              payment_reference = $2,
              updated_at = NOW()
          WHERE id = $1
          `,
          [orderId, payload.pf_payment_id]
        );

        //  GET ORDER INFO
        const orderResult = await client.query(
          `
          SELECT merchant_id, total_amount_cents
          FROM orders
          WHERE id = $1
          `,
          [orderId]
        );

        const merchantId = orderResult.rows[0].merchant_id;
        const grossAmount = orderResult.rows[0].total_amount_cents / 100;

        // CALCULATE PLATFORM FEE (10%)
        const platformFeePercent = 0.1;
        const platformFee = grossAmount * platformFeePercent;
        const netAmount = grossAmount - platformFee;

        // INSERT MERCHANT EARNINGS
        await client.query(
          `
          INSERT INTO merchant_earnings (
            merchant_id,
            order_id,
            gross_amount,
            platform_fee,
            net_amount,
            status,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
          `,
          [
            merchantId,
            orderId,
            grossAmount,
            platformFee,
            netAmount
          ]
        );

        await client.query("COMMIT");

        console.log("Payment completed & earnings recorded:", orderId);

      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }



    // Handle FAILED / CANCELLED payment
    if (status === "FAILED" || status === "CANCELLED") {
      await pool.query(
        `
        UPDATE payments
        SET status = $2,
            raw_notify_payload = $3,
            updated_at = NOW()
        WHERE id = $1
        `,
        [payment.id, status.toLowerCase(), payload]
      );
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error(" PayFast IPN Error:", error);
    return res.status(500).send("ERROR");
  }
};

// ---------------------------------------------------
// PAYFAST REDIRECT URLS (User-facing)
// ---------------------------------------------------
export const payfastSuccess = (_: Request, res: Response) =>
  res.send("Payment successful");

export const payfastCancel = (_: Request, res: Response) =>
  res.send("Payment cancelled");

// ---------------------------------------------------
// Helper: PayFast MD5 Signature Generator
// ---------------------------------------------------
function generateSignature(data: any, passphrase?: string) {
  let pfString = "";

  Object.keys(data)
    .sort()
    .forEach((key) => {
      pfString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}&`;
    });

  pfString = passphrase
    ? pfString +
      `passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
    : pfString.slice(0, -1);

  return crypto.createHash("md5").update(pfString).digest("hex");
}
