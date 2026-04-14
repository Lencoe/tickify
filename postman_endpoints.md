# Tickify API -- Postman Endpoints Guide

Base URL:

    http://localhost:5000

------------------------------------------------------------------------

# Headers Setup (Postman)

For authenticated routes:

    Authorization: Bearer {{token}}
    Content-Type: application/json

Create Postman environment variables:

    base_url = http://localhost:5000/ping
    customer_token =
    merchant_token =
    admin_token =
    event_id =
    ticket_id =
    order_id =
    merchant_id =

------------------------------------------------------------------------

# 1. Health Check

GET

    {{base_url}}/ping

Response:

    ✅ Tickify API running

------------------------------------------------------------------------

# 2. User Endpoints

## Register Customer

POST

    http://localhost:5000/api/users/register

Body:

``` json
{
  "role": "customer",
  "first_name": "Johnn",
  "last_name": "Doe",
  "email": "johnn@test.com",
  "password": "Password123!",
  "phone": "+27791234567",
  "id_number": "9001010000087",
  "address": "Johannesburg"
}
```

------------------------------------------------------------------------

## Login

POST

    {{base_url}}/api/users/login

Body:

``` json
{
  "email": "john@test.com",
  "password": "Password123!"
}
```
token temp = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZkNjg1ZmI0LWFjNjktNGY5OC05MjVhLTQ2OWU5N2NlZjdjYyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc3MjE3OTYxMywiZXhwIjoxNzcyNzg0NDEzfQ.mVfbAMb_qtG68XhlGH6WVeqv4O7qUsQVjryPKQBYBu4
------------------------------------------------------------------------

# 3. Merchant Endpoints

## Register Merchant

POST

    {{base_url}}/api/merchants/register

form-data fields:

    role: merchant
    first_name: Merchant
    last_name: Test
    email: merchant@test.com
    password: Password123!
    phone: +27791234567
    id_number: 9001010000087
    address: Johannesburg
    company_name: Tickify Events
    physical_address: Sandton
    bank_account_details: Test Bank
    business_registration_number: 2024/123456/07

------------------------------------------------------------------------

# 4. Event Endpoints

## Create Event

POST

    {{base_url}}/api/merchant/events

------------------------------------------------------------------------

## Publish Event

PATCH

    {{base_url}}/api/merchant/events/{{event_id}}/publish

------------------------------------------------------------------------

# 5. Ticket Endpoints

## Create Ticket

POST

    {{base_url}}/api/tickets

------------------------------------------------------------------------

# 6. Order Endpoints

## Create Order

POST

    {{base_url}}/api/orders

System automatically:

    status = pending
    expires_at = now + 15 minutes

------------------------------------------------------------------------

# 7. PayFast Endpoints

## Initiate Payment

POST

    {{base_url}}/api/payfast/initiate

Response:

``` json
{
  "payment_id": "uuid",
  "redirect_url": "https://sandbox.payfast.co.za/..."
}
```

------------------------------------------------------------------------

# 8. Merchant Earnings

## Get Merchant Earnings

GET

    {{base_url}}/api/merchant/earnings

------------------------------------------------------------------------

# 9. Automatic Cleanup

Runs automatically every 5 minutes.

Cancels expired orders:

    pending → cancelled

Restores ticket quantities.

------------------------------------------------------------------------

# System Status Summary

Working:

    User system
    Merchant system
    Event publishing
    Ticket system
    Order system
    Cancel order
    PayFast integration
    Merchant earnings
    Automatic cleanup
    Overselling protection

------------------------------------------------------------------------

# Recommended Postman Folder Structure

    Tickify API
    │
    ├── Health
    ├── Users
    ├── Merchants
    ├── Events
    ├── Tickets
    ├── Orders
    ├── Payments
    └── Earnings
