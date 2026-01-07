// src/controllers/payfastController.ts
import { Request, Response } from "express";
import crypto from "crypto";
import pool from "../config/db";
import qs from "querystring";

const PF_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.payfast.co.za/eng/process"
    : "https://sandbox.payfast.co.za/eng/process";


// ---------------------------------------------------
// 1️⃣ INITIATE PAYMENT (CREATE PAYMENT RECORD)
// ---------------------------------------------------
export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;
    const customerId = req.user?.id;

    if (!order_id) {
      return res.status(400).json({ message: "order_id is required" });
    }

    // 1️⃣ Fetch order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderResult.rows[0];

    // 2️⃣ Ownership check
    if (order.customer_id !== customerId) {
      return res.status(403).json({ message: "Unauthorized access to order" });
    }

    // 3️⃣ Prevent double payment
    if (order.status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // 4️⃣ Create payment record
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
      RETURNING *;
      `,
      [
        order.id,
        customerId,
        order.id, // merchant_reference (m_payment_id)
        order.total_amount_cents,
        order.currency,
      ]
    );

    const payment = paymentResult.rows[0];

    // 5️⃣ Build PayFast payload
    const data: any = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: process.env.PAYFAST_RETURN_URL,
      cancel_url: process.env.PAYFAST_CANCEL_URL,
      notify_url: process.env.PAYFAST_NOTIFY_URL,

      amount: (order.total_amount_cents / 100).toFixed(2),
      item_name: `Tickify Order ${order.id}`,
      m_payment_id: order.id,
    };

    // 6️⃣ Generate signature
    const signature = generateSignature(
      data,
      process.env.PAYFAST_PASSPHRASE
    );
    data.signature = signature;

    const redirectUrl = `${PF_URL}?${qs.stringify(data)}`;

    // 7️⃣ Respond
    return res.status(200).json({
      message: "Payment initiated",
      payment_id: payment.id,
      redirect_url: redirectUrl,
    });
  } catch (error) {
    console.error("❌ PayFast Initiation Error:", error);
    return res.status(500).json({ message: "Payment initiation failed" });
  }
};


// ---------------------------------------------------
// 2️⃣ PAYFAST IPN (SECURE)
// ---------------------------------------------------
export const payfastNotify = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // 1️⃣ Validate required fields
    if (!data.m_payment_id || !data.payment_status || !data.signature) {
      return res.status(400).send("Invalid IPN");
    }

    // 2️⃣ Verify signature
    const receivedSignature = data.signature;
    delete data.signature;

    const calculatedSignature = generateSignature(
      data,
      process.env.PAYFAST_PASSPHRASE
    );

    if (receivedSignature !== calculatedSignature) {
      console.error("❌ Invalid PayFast signature");
      return res.status(400).send("Invalid signature");
    }

    const orderId = data.m_payment_id;
    const paymentStatus = data.payment_status;

    // 3️⃣ Only process COMPLETE payments
    if (paymentStatus === "COMPLETE") {
      // Update payment
      await pool.query(
        `
        UPDATE payments
        SET status = 'completed',
            updated_at = NOW()
        WHERE merchant_reference = $1
          AND provider = 'payfast'
        `,
        [orderId]
      );


      // Update order
      await pool.query(
        `
        UPDATE orders
        SET status = 'paid',
            payment_provider = 'payfast',
            payment_reference = $1,
            updated_at = NOW()
        WHERE id = $1
        `,
        [orderId]
      );

      console.log("✅ Payment completed for order:", orderId);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("❌ PayFast IPN Error:", error);
    return res.status(500).send("ERROR");
  }
};


// ---------------------------------------------------
// 3️⃣ RETURN URL
// ---------------------------------------------------
export const payfastSuccess = async (req: Request, res: Response) => {
  res.send("Payment successful! Thank you.");
};

// ---------------------------------------------------
// 4️⃣ CANCEL URL
// ---------------------------------------------------
export const payfastCancel = async (req: Request, res: Response) => {
  res.send("Payment canceled.");
};

// ---------------------------------------------------
// Helper: Generate signature
// ---------------------------------------------------
function generateSignature(data: any, passphrase?: string) {
  let pfString = "";
  Object.keys(data)
    .sort()
    .forEach((key) => {
      pfString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}&`;
    });

  if (passphrase) {
    pfString += `passphrase=${encodeURIComponent(passphrase).replace(
      /%20/g,
      "+"
    )}`;
  } else {
    pfString = pfString.slice(0, -1);
  }

  return crypto.createHash("md5").update(pfString).digest("hex");
}
