# Tickify API - Postman Test Collection (UPDATED)

## Base URL
```
http://localhost:5000
```

---

# Health Check

## 1. Ping Server
**Method:** GET  
**URL:**
```
http://localhost:5000/ping
```

**Expected Response:**
```
✅ Tickify API running
```

---

# User Routes (`/api/users`)

## 2. Register Customer
**POST** `/api/users/register`

Body:
```json
{
  "role": "customer",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@test.com",
  "password": "Password123!",
  "phone": "+27791234567",
  "id_number": "9001010000087",
  "address": "Cape Town"
}
```

---

## 3. Login
**POST** `/api/users/login`

Body:
```json
{
  "email": "john@test.com",
  "password": "Password123!"
}
```

Save token.

---

# Merchant Routes (`/api/merchants`)

## 4. Register Merchant
**POST** `/api/merchants/register`
(Form-data with documents)

---

## 5. Verify Merchant (Admin)
**PUT**
```
/api/merchants/{merchant_id}/verify
```

Body:
```json
{
  "status": "approved"
}
```

---

# Merchant Event Routes (`/api/merchant/events`)

## 6. Create Event
**POST**
```
/api/merchant/events
```

Body:
```json
{
  "title": "Music Festival",
  "description": "Live concert",
  "category": "festival",
  "venue_name": "Sandton Arena",
  "venue_address": "Johannesburg",
  "start_datetime": "2026-12-01T18:00:00Z",
  "end_datetime": "2026-12-01T23:00:00Z"
}
```

Status will be:
```
draft
```

---

## 7. Publish Event ✅ NEW

**PATCH**
```
/api/merchant/events/{event_id}/publish
```

Expected:

```json
{
  "message": "Event published successfully"
}
```

Status becomes:

```
published
```

---

# Ticket Routes (`/api/tickets`)

## 8. Create Ticket Type

**POST**
```
/api/tickets
```

Body:
```json
{
  "event_id": "EVENT_ID",
  "name": "General",
  "price_cents": 10000,
  "currency": "ZAR",
  "total_quantity": 100,
  "available_quantity": 100
}
```

---

# Order Routes (`/api/orders`)

## 9. Create Order

**POST**
```
/api/orders
```

Body:
```json
{
  "merchant_id": "MERCHANT_ID",
  "currency": "ZAR",
  "items": [
    {
      "ticket_type_id": "TICKET_TYPE_ID",
      "quantity": 2,
      "unit_price_cents": 10000
    }
  ]
}
```

Order created with:

```
status = pending
expires_at = NOW() + 15 minutes
```

---

## 10. Cancel Order ✅ NEW

**PATCH**
```
/api/orders/{order_id}/cancel
```

Expected:

```json
{
  "message": "Order cancelled successfully"
}
```

Tickets restored automatically.

---

# PayFast Routes (`/api/payfast`) ✅ NEW

## 11. Initiate Payment

**POST**
```
/api/payfast/initiate
```

Body:
```json
{
  "order_id": "ORDER_ID"
}
```

Response:

```json
{
  "payment_id": "uuid",
  "redirect_url": "https://sandbox.payfast.co.za/..."
}
```

---

## 12. PayFast Notify (Webhook)

**POST**
```
/api/payfast/notify
```

PayFast sends automatically.

System updates:

```
payments.status = paid
orders.status = paid
merchant_earnings created
```

---

# Merchant Earnings Routes ✅ NEW

## 13. Get Merchant Earnings

**GET**
```
/api/merchant/earnings
```

Response:

```json
[
  {
    "merchant_id": "uuid",
    "amount_cents": 20000,
    "currency": "ZAR",
    "status": "pending"
  }
]
```

---

# Automatic Cleanup System ✅ NEW

Runs automatically every 5 minutes.

Cancels expired orders:

```
status: pending → cancelled
```

Restores ticket quantity.

---

# FULL TEST FLOW

Follow this order:

```
1 Register customer
2 Register merchant
3 Verify merchant
4 Merchant create event
5 Publish event
6 Create ticket
7 Customer create order
8 Initiate payment
9 PayFast notify
10 Verify earnings
11 Test cancel order
12 Test cleanup
```

---

# Important Notes

Port:

```
5000
```

NOT 3000.

---

# System Status: Production Ready Features

Implemented:

✔ Events  
✔ Tickets  
✔ Orders  
✔ Cancel orders  
✔ PayFast payments  
✔ Merchant earnings  
✔ Automatic cleanup  
✔ Overselling protection  
✔ Ticket locking  

---

End of file.

