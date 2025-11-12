# Tickify API - Postman Test Collection

## Base URL
```
http://localhost:3000
```

## Health Check
### 1. Ping Server
- **Method:** GET
- **URL:** `http://localhost:3000/ping`
- **Auth:** None
- **Response:** `✅ Tickify API running`

---

## User Routes (`/api/users`)

### 2. Register Customer
- **Method:** POST
- **URL:** `http://localhost:3000/api/users/register`
- **Auth:** None
- **Headers:** 
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "role": "customer",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "phone": "+27791234567",
    "id_number": "9001010000087",
    "address": "12 Main St, Cape Town"
  }
  ```
- **Notes:** `role` will normally be set by the endpoint; include here to reflect DB schema (role must be one of `admin`, `merchant`, `customer`). The server should store `password_hash` (not raw password).
- **Expected Response (201):**
  ```json
  {
    "message": "User registered",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "role": "customer",
      "is_verified": false,
      "created_at": "2025-11-12T10:00:00Z"
    }
  }
  ```

### 3. Login Customer
- **Method:** POST
- **URL:** `http://localhost:3000/api/users/login`
- **Auth:** None
- **Headers:**
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-here",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  }
  ```

---

## Merchant Routes (`/api/merchants`)

### 4. Register Merchant (with file uploads)
- **Method:** POST
- **URL:** `http://localhost:3000/api/merchants/register`
- **Auth:** None
- **Headers:** 
  - Use **Form-data** (NOT JSON)
- **Body (Form-data):**
  ```
  role: merchant
  first_name: John
  last_name: Smith
  email: john.smith@merchant.com
  password: MerchantPass123!
  phone: +27821234567
  id_number: 8901234567890
  address: 123 Business Ave
  company_name: Smith's Events
  physical_address: 456 Commerce St, Johannesburg
  bank_account_details: AccountName|1234567890|BranchCode
  business_registration_number: BR1234567890

  [Files - select from your computer]
  id_document: [Select .pdf or .jpg file]
  proof_of_residence: [Select .pdf or .jpg file]
  proof_of_bank: [Select .pdf or .jpg file]
  cipc_document: [Select .pdf or .jpg file]
  ```
- **Notes:** The request will create a `users` record plus a `merchants` record (merchant `id` references `users.id`). The `status` should default to `pending`.
- **Expected Response (201):**
  ```json
  {
    "message": "Merchant registered successfully. Awaiting verification.",
    "user": {
      "id": "uuid-here",
      "email": "john.smith@merchant.com",
      "role": "merchant",
      "is_verified": false
    },
    "merchant": {
      "id": "uuid-here",
      "company_name": "Smith's Events",
      "business_registration_number": "BR1234567890",
      "status": "pending"
    }
  }
  ```

### 5. Get Pending Merchants (Admin only)
- **Method:** GET
- **URL:** `http://localhost:3000/api/merchants/pending`
- **Auth:** Bearer Token (Admin JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  [
    {
      "id": "uuid-here",
      "user_id": "uuid-here",
      "company_name": "Smith's Events",
      "status": "pending",
      "id_number": "8901234567890",
      "bank_account_details": "1234567890"
    }
  ]
  ```

### 6. Verify Merchant (Admin only)
- **Method:** PUT
- **URL:** `http://localhost:3000/api/merchants/{merchant_id}/verify`
- **Auth:** Bearer Token (Admin JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_ADMIN_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "status": "approved"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "message": "Merchant verified successfully",
    "merchant": {
      "id": "uuid-here",
      "status": "approved"
    }
  }
  ```

---

## Merchant Event Routes (`/api/merchant`)
**Note:** All routes require `authenticateJWT` + `requireRole('merchant')`

### 7. Create Event
- **Method:** POST
- **URL:** `http://localhost:3000/api/merchant/events`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "merchant_id": "uuid-of-merchant-here",
    "title": "Summer Music Festival 2025",
    "description": "Join us for an amazing summer concert",
    "category": "festival",
    "venue_name": "Sandton Convention Centre",
    "venue_address": "Sandton, Johannesburg",
    "start_datetime": "2025-06-15T18:00:00Z",
    "end_datetime": "2025-06-15T23:00:00Z",
    "age_restriction": 18,
    "image_url": "http://localhost:3000/uploads/event-1.jpg",
    "status": "published"
  }
  ```
- **Expected Response (201):**
  ```json
  {
    "message": "Event created successfully",
    "event": {
      "id": "uuid-here",
      "merchant_id": "uuid-here",
      "title": "Summer Music Festival 2025",
      "status": "active",
      "created_at": "2025-11-12T10:00:00Z"
    }
  }
  ```

### 8. Get All Events (Merchant's events)
- **Method:** GET
- **URL:** `http://localhost:3000/api/merchant/events`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  [
    {
      "id": "uuid-here",
      "merchant_id": "uuid-here",
      "title": "Summer Music Festival 2025",
      "description": "Join us for an amazing summer concert",
      "event_date": "2025-06-15T18:00:00Z",
      "location": "Sandton Convention Centre",
      "total_capacity": 5000,
      "status": "active",
      "created_at": "2025-11-12T10:00:00Z"
    }
  ]
  ```

### 9. Update Event
- **Method:** PUT
- **URL:** `http://localhost:3000/api/merchant/events/{event_id}`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
  "title": "Summer Music Festival 2025 - Updated",
  "description": "Updated description",
  "start_datetime": "2025-06-20T18:00:00Z",
  "end_datetime": "2025-06-20T23:00:00Z",
  "venue_name": "Johannesburg Stadium",
  "age_restriction": 16
  }
  
  ```
- **Expected Response (200):**
  ```json
  {
    "message": "Event updated successfully",
    "event": {
      "id": "uuid-here",
      "title": "Summer Music Festival 2025 - Updated",
      "status": "active"
    }
  }
  ```

### 10. Cancel Event
- **Method:** DELETE
- **URL:** `http://localhost:3000/api/merchant/events/{event_id}`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "message": "Event cancelled successfully"
  }
  ```

### 11. Get Event Reports
- **Method:** GET
- **URL:** `http://localhost:3000/api/merchant/events/{event_id}/reports`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "event_id": "uuid-here",
    "event_title": "Summer Music Festival 2025",
    "total_tickets_created": 5000,
    "total_tickets_sold": 2340,
    "total_revenue_cents": 117000000,
    "revenue_zar": "R 1,170,000.00"
  }
  ```

---

## Ticket Routes (`/api/tickets`)

### 12. Create Ticket Type (Merchant only)
- **Method:** POST
- **URL:** `http://localhost:3000/api/tickets`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "event_id": "uuid-of-event-here",
    "name": "VIP",
    "price_cents": 50000,
    "currency": "ZAR",
    "total_quantity": 500,
    "available_quantity": 500,
    "sales_start": "2025-03-01T00:00:00Z",
    "sales_end": "2025-06-15T17:00:00Z",
    "description": "VIP access with front row seating"
  }
  ```
- **Expected Response (201):**
  ```json
  {
    "message": "Ticket type created successfully",
    "ticket": {
      "id": "uuid-here",
      "event_id": "uuid-of-event-here",
      "ticket_type": "VIP",
      "price_cents": 50000,
      "available_quantity": 500,
      "created_at": "2025-11-12T10:00:00Z"
    }
  }
  ```

### 13. Get Tickets by Event (Public)
- **Method:** GET
- **URL:** `http://localhost:3000/api/tickets/{event_id}`
- **Auth:** None
- **Expected Response (200):**
  ```json
  [
    {
      "id": "uuid-here",
      "event_id": "uuid-of-event-here",
      "ticket_type": "VIP",
      "price_cents": 50000,
      "available_quantity": 485,
      "description": "VIP access with front row seating"
    },
    {
      "id": "uuid-here",
      "event_id": "uuid-of-event-here",
      "ticket_type": "Regular",
      "price_cents": 15000,
      "available_quantity": 1200,
      "description": "Regular general admission"
    }
  ]
  ```

### 14. Update Ticket Type (Merchant only)
- **Method:** PUT
- **URL:** `http://localhost:3000/api/tickets/{ticket_id}`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "name": "Premium VIP",
    "price_cents": 75000,
    "sales_start": "2025-03-01T00:00:00Z",
    "sales_end": "2025-06-15T16:00:00Z"
  }
  ```
- **Allowed Update Fields:** `name`, `price_cents`, `currency`, `total_quantity`, `available_quantity`, `sales_start`, `sales_end`
- **Expected Response (200):**
  ```json
  {
    "message": "Ticket updated successfully",
    "ticket": {
      "id": "uuid-here",
      "name": "Premium VIP",
      "price_cents": 75000
    }
  }
  ```

### 15. Delete Ticket Type (Merchant only)
- **Method:** DELETE
- **URL:** `http://localhost:3000/api/tickets/{ticket_id}`
- **Auth:** Bearer Token (Merchant JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  {
    "message": "Ticket type deleted successfully"
  }
  ```

---

## Order Routes (`/api/orders`)

### 16. Create Order (Customer only)
- **Method:** POST
- **URL:** `http://localhost:3000/api/orders`
- **Auth:** Bearer Token (Customer JWT)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_CUSTOMER_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "merchant_id": "1213881e-cdf9-4ca1-aad6-3937a07e6e8c",
    "total_amount_cents": 100000,
    "currency": "ZAR",
    "items": [
      {
        "ticket_type_id": "37226adc-92f1-4d26-ad2e-8b7b5fd1a4c3",
        "quantity": 2,
        "unit_price_cents": 50000
      }
    ]
  }
  ```
- **Expected Response (201):**
  ```json
  {
    "message": "Order created successfully.",
    "order": {
      "id": "uuid-here",
      "customer_id": "uuid-here",
      "merchant_id": "uuid-of-merchant-here",
      "total_amount_cents": 100000,
      "currency": "ZAR",
      "status": "pending",
      "created_at": "2025-11-12T10:00:00Z"
    }
  }
  ```

### 17. Get Order by ID
- **Method:** GET
- **URL:** `http://localhost:3000/api/orders/{order_id}`
- **Auth:** Bearer Token (Any role)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE"
  }
  ```
- **Expected Response (200):**
  ```json
  [
    {
      "id": "uuid-here",
      "customer_id": "uuid-here",
      "merchant_id": "uuid-of-merchant-here",
      "total_amount_cents": 100000,
      "currency": "ZAR",
      "status": "pending",
      "created_at": "2025-11-12T10:00:00Z",
      "ticket_type_id": "uuid-of-ticket-1",
      "quantity": 2,
      "unit_price_cents": 50000
    }
  ]
  ```

### 18. Get All Orders (Merchant/Admin only)
- **Method:** GET
- **URL:** `http://localhost:3000/api/orders`
- **Auth:** Bearer Token (Merchant or Admin)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_OR_ADMIN_JWT_TOKEN_HERE"
  }
  ```
- **Note:** Merchants see only their orders; Admins see all orders
- **Expected Response (200):**
  ```json
  [
    {
      "id": "uuid-here",
      "customer_id": "uuid-here",
      "merchant_id": "uuid-of-merchant-here",
      "total_amount_cents": 100000,
      "currency": "ZAR",
      "status": "pending",
      "created_at": "2025-11-12T10:00:00Z"
    }
  ]
  ```

### 19. Update Order Status (Merchant/Admin only)
- **Method:** PATCH
- **URL:** `http://localhost:3000/api/orders/{order_id}/status`
- **Auth:** Bearer Token (Merchant or Admin)
- **Headers:**
  ```json
  {
    "Authorization": "Bearer YOUR_MERCHANT_OR_ADMIN_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
  }
  ```
- **Body (Raw JSON):**
  ```json
  {
    "status": "paid"
  }
  ```
- **Valid Status Values:** `pending`, `paid`, `cancelled`, `refunded`
- **Expected Response (200):**
  ```json
  {
    "message": "Order status updated successfully",
    "order": {
      "id": "uuid-here",
      "status": "paid",
      "updated_at": "2025-11-12T10:05:00Z"
    }
  }
  ```

---

## Quick Test Workflow

### Scenario 1: Register & Login as Customer
1. Call endpoint #2 (Register Customer) → Save token
2. Call endpoint #3 (Login Customer) with same credentials → Verify token

### Scenario 2: Register Merchant & Get Verified
1. Call endpoint #4 (Register Merchant) with files → Save token & merchant_id
2. Switch to admin account
3. Call endpoint #5 (Get Pending Merchants)
4. Call endpoint #6 (Verify Merchant) with merchant_id

### Scenario 3: Create Event & Tickets (As Merchant)
1. Use merchant token from scenario 2
2. Call endpoint #7 (Create Event) → Save event_id
3. Call endpoint #12 (Create Ticket Type) with event_id → Save ticket_id
4. Call endpoint #13 (Get Tickets by Event) with event_id

### Scenario 4: Create Order (As Customer)
1. Use customer token from scenario 1
2. Call endpoint #16 (Create Order) with merchant_id & ticket_type_id
3. Call endpoint #17 (Get Order by ID) with order_id

### Scenario 5: View & Update Orders (As Merchant)
1. Use merchant token
2. Call endpoint #18 (Get All Orders)
3. Call endpoint #19 (Update Order Status) to mark as paid

---

## Headers Quick Reference

### No Authentication Needed
- GET `/ping`
- POST `/api/users/register`
- POST `/api/users/login`
- POST `/api/merchants/register` (form-data)
- GET `/api/tickets/{eventId}`

### Customer Authentication
- POST `/api/orders`
- GET `/api/orders/{id}`

### Merchant Authentication
- POST `/api/merchant/events`
- PUT `/api/merchant/events/{id}`
- DELETE `/api/merchant/events/{id}`
- GET `/api/merchant/events`
- GET `/api/merchant/events/{id}/reports`
- POST `/api/tickets`
- PUT `/api/tickets/{id}`
- DELETE `/api/tickets/{id}`
- GET `/api/orders`
- PATCH `/api/orders/{id}/status`

### Admin Authentication
- GET `/api/merchants/pending`
- PUT `/api/merchants/{id}/verify`
- GET `/api/orders`
- PATCH `/api/orders/{id}/status`

---

## Testing Tips

1. **Save Tokens:** After login, copy the JWT token and paste it in the Authorization header for authenticated routes
2. **Environment Variables in Postman:** Create an environment with `token`, `merchant_id`, `event_id`, `ticket_id`, `order_id` variables
3. **Test Order:** Always register/login first before testing protected routes
4. **File Upload:** Make sure to use "Form-data" in Postman for merchant registration (not JSON)
5. **Timestamps:** Use ISO 8601 format for dates (e.g., `2025-06-15T18:00:00Z`)
6. **Prices:** All prices are in cents (e.g., R 500 = 50000 cents)

---

## Duplicate & Validation Tests

These tests exercise the DB-level constraints and application validation derived from your schema.

### A. Duplicate Email (users.email UNIQUE)
- **Method:** POST
- **URL:** `/api/users/register`
- **Body:** same email as an existing user
- **Expected:** 400 with message `User already exists` or a 400 mapping of Postgres unique_violation (code 23505).

### B. Duplicate ID Number (users.id_number unique if enforced)
- **Method:** POST
- **URL:** `/api/users/register`
- **Body:** different email but same `id_number` as an existing user
- **Expected:** 400 with message `ID number already used` (if application-level check) or 400/409 if DB constraint exists.

### C. Duplicate Business Registration Number (merchants.business_registration_number)
- **Method:** POST
- **URL:** `/api/merchants/register`
- **Body:** new merchant with same `business_registration_number` as existing merchant
- **Expected:** 400 with message `Business registration number already used` or DB unique violation mapping.

### D. Missing Required Merchant Documents
- **Method:** POST
- **URL:** `/api/merchants/register`
- **Body:** omit `id_document` or `cipc_document` files in form-data
- **Expected:** 400 with message indicating required documents are missing (if server validates), or registration proceeds but admin rejects during verification.

### E. Merchant Login Before Verification
- **Method:** POST
- **URL:** `/api/users/login`
- **Body:** merchant credentials for a user whose `merchants.status` = `pending` or `users.is_verified` = false
- **Expected:** 403/401 with message `Merchant not verified` or `Account not verified`.

### F. Concurrent Registrations (race)
- Simulate two clients registering the same email/id_number at the same time. The DB unique constraint must prevent duplicates; the second request should fail with unique_violation (23505).

---

If you want, I can also add example Postman tests (pre-request scripts and tests) that automatically assert HTTP status codes and save returned IDs/tokens into environment variables.
