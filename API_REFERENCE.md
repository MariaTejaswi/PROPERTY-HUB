# API Endpoints Quick Reference

Base URL: `http://localhost:5000/api`

## 🔐 Authentication (`/auth`)

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "landlord",  // or "tenant" or "manager"
  "phone": "555-1234"  // optional
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { token, user: { id, name, email, role } }
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "phone": "555-5678"
}
```

---

## 🏠 Properties (`/properties`)

### Get All Properties
```http
GET /properties
Authorization: Bearer <token>

Response: { properties: [...] }
```

### Get Single Property
```http
GET /properties/:id
Authorization: Bearer <token>
```

### Create Property (Landlord only)
```http
POST /properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Sunset Apartments",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102"
  },
  "bedrooms": 2,
  "bathrooms": 2,
  "rentAmount": 2500,
  "depositAmount": 5000,
  "amenities": ["parking", "laundry", "gym"]
}
```

### Update Property
```http
PUT /properties/:id
Authorization: Bearer <token>

{
  "rentAmount": 2600,
  "status": "occupied"
}
```

### Delete Property
```http
DELETE /properties/:id
Authorization: Bearer <token>
```

### Assign Tenant
```http
POST /properties/:id/assign-tenant
Authorization: Bearer <token>

{
  "tenantId": "user_id_here"
}
```

---

## 💳 Payments (`/payments`)

### Get All Payments
```http
GET /payments
Authorization: Bearer <token>

Optional query params:
- status: pending | processing | paid | failed
- property: propertyId
```

### Get Single Payment
```http
GET /payments/:id
Authorization: Bearer <token>
```

### Create Payment (Landlord only)
```http
POST /payments
Authorization: Bearer <token>

{
  "property": "propertyId",
  "lease": "leaseId",
  "tenant": "tenantId",
  "amount": 2500,
  "dueDate": "2025-12-01",
  "description": "December rent"
}
```

### Process Payment (Demo Gateway)
```http
POST /payments/:id/process
Authorization: Bearer <token>

{
  "cardNumber": "4242424242424242",  // Test card for success
  "expiryMonth": "12",
  "expiryYear": "25",
  "cvv": "123",
  "zipCode": "12345"
}

Test Cards:
- 4242424242424242 = Success
- 4000000000000002 = Declined
- 4000000000009995 = Insufficient funds
- 4000000000000069 = Expired card
```

### Get Payment Stats
```http
GET /payments/stats
Authorization: Bearer <token>

Response: {
  totalPaid: 15000,
  totalPending: 5000,
  byStatus: [...]
}
```

---

## 🔧 Maintenance (`/maintenance`)

### Get All Requests
```http
GET /maintenance
Authorization: Bearer <token>

Optional query params:
- status: pending | in_progress | completed
- priority: low | medium | high | urgent
- property: propertyId
```

### Get Single Request
```http
GET /maintenance/:id
Authorization: Bearer <token>
```

### Create Request
```http
POST /maintenance
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "property": "propertyId",
  "title": "Leaking faucet",
  "description": "Kitchen sink faucet is dripping",
  "priority": "medium",
  "images": [file1, file2]  // Max 500MB total
}
```

### Update Request Status
```http
PUT /maintenance/:id
Authorization: Bearer <token>

{
  "status": "in_progress"
}
```

### Add Comment
```http
POST /maintenance/:id/comments
Authorization: Bearer <token>

{
  "text": "The plumber will arrive tomorrow at 2pm"
}
```

---

## 📄 Leases (`/leases`)

### Get All Leases
```http
GET /leases
Authorization: Bearer <token>

Optional query params:
- status: draft | active | expired
- property: propertyId
```

### Get Single Lease
```http
GET /leases/:id
Authorization: Bearer <token>
```

### Create Lease (Landlord only)
```http
POST /leases
Authorization: Bearer <token>

{
  "property": "propertyId",
  "tenant": "tenantId",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "rentAmount": 2500,
  "depositAmount": 5000,
  "terms": "Lease agreement terms and conditions..."
}
```

### Sign Lease
```http
POST /leases/:id/sign
Authorization: Bearer <token>

{
  "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "role": "landlord"  // or "tenant"
}
```

### Update Lease
```http
PUT /leases/:id
Authorization: Bearer <token>

{
  "status": "active",
  "terms": "Updated terms..."
}
```

---

## 💬 Messages (`/messages`)

### Get Conversations
```http
GET /messages
Authorization: Bearer <token>

Response: Array of conversations with last message
```

### Get Conversation Messages
```http
GET /messages/conversation/:userId
Authorization: Bearer <token>

Response: All messages between current user and specified user
```

### Send Message
```http
POST /messages
Authorization: Bearer <token>

{
  "recipient": "userId",
  "content": "Hello, I have a question about the rent payment"
}
```

### Mark as Read
```http
PUT /messages/:id/read
Authorization: Bearer <token>
```

### Get Unread Count
```http
GET /messages/unread/count
Authorization: Bearer <token>

Response: { count: 5 }
```

---

## 📊 Stats Endpoints

### Payment Statistics
```http
GET /payments/stats
Authorization: Bearer <token>
```

### Maintenance Statistics
```http
GET /maintenance/stats
Authorization: Bearer <token>
```

---

## 📁 File Upload

All file upload endpoints support:
- Max file size: 500MB
- Allowed types: JPG, PNG, PDF
- Files saved to: `/uploads`

Images are automatically handled by `multer` middleware configured in `server/config/multer.js`.

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "message": "Error description",
  "stack": "Stack trace (development only)"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token_here>
```

Token is returned from `/auth/login` and `/auth/register` endpoints.

---

## CORS

CORS is enabled for `http://localhost:3000` in development.

---

## Testing Tips

1. **Use test accounts** created by seed script:
   - `landlord@test.com` / `Test123!`
   - `tenant1@test.com` / `Test123!`
   - `tenant2@test.com` / `Test123!`
   - `manager@test.com` / `Test123!`

2. **Get a token**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"landlord@test.com","password":"Test123!"}'
   ```

3. **Use the token**:
   ```bash
   curl http://localhost:5000/api/properties \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

4. **Test demo payments** with these card numbers:
   - Success: `4242424242424242`
   - Declined: `4000000000000002`
   - Insufficient funds: `4000000000009995`
   - Expired: `4000000000000069`

---

All endpoints are fully functional and tested! 🚀
