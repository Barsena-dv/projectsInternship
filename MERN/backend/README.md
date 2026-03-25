# PostNFind - Backend

A complete Node.js + Express + MongoDB backend for a lost-item recovery platform.

## 🎯 Features

✅ **Authentication** - JWT-based register/login with email verification  
✅ **Payment Escrow** - Secure payment locking and release system  
✅ **No Direct Contact Rule** - Chat unlocks only after evidence verification  
✅ **Tracking System** - Real-time finder updates (non-GPS)  
✅ **Evidence Verification** - Owner confirms item before payment release  
✅ **Service Plans** - Basic, Standard, Premium with refund policies  
✅ **Ratings & Disputes** - Review system and dispute resolution  
✅ **Cloudinary Integration** - Cloud image/video storage  
✅ **Email Notifications** - Registration, assignments, verification emails  

## 📁 Project Structure

```
src/
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── env.config.js         # Environment validation
│   ├── payment.config.js     # Payment settings
│   └── cloudinary.js         # Cloudinary setup
│
├── middleware/
│   ├── auth.middleware.js    # JWT verification
│   ├── role.middleware.js    # Role-based access
│   ├── error.middleware.js   # Global error handler
│   └── upload.middleware.js  # Multer file upload
│
├── modules/
│   ├── auth/                 # Authentication
│   ├── users/                # User management
│   ├── requests/             # Lost item requests
│   ├── assignments/          # Finder assignments
│   ├── tracking/             # Finder location updates
│   ├── evidence/             # Evidence uploads
│   ├── payments/             # Payment escrow
│   ├── refunds/              # Refund logic
│   ├── payouts/              # Finder payouts
│   ├── chat/                 # Messaging
│   ├── ratings/              # Reviews
│   ├── disputes/             # Dispute handling
│   └── servicePlans/         # Service plan CRUD
│
├── utils/
│   ├── jwt.js               # Token generation
│   ├── passwordHash.js      # Password hashing
│   ├── mailer.js            # Email sending
│   └── refundCalculator.js  # Refund calculations
│
├── app.js                   # Express setup
└── server.js                # Server entry point
```

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14+)
- MongoDB
- Cloudinary account
- Gmail/SMTP account

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env` File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## 📚 API Documentation

### Auth Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
POST   /api/auth/verify-email      Verify email
POST   /api/auth/refresh           Refresh JWT token
```

**Register Example:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "both"
}
```

**Login Example:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Request Endpoints

```
POST   /api/requests                Create lost item request
GET    /api/requests                Get all requests (with filters)
GET    /api/requests/:id            Get request by ID
POST   /api/requests/:id/confirm    Confirm item found (owner only)
GET    /api/requests/user/my-requests  Get user's requests
```

**Create Request Example:**
```json
{
  "title": "Lost iPhone 13",
  "description": "Silver iPhone 13, lost near Central Park",
  "category": "electronics",
  "reward": 5000,
  "location": {
    "address": "Central Park, New York",
    "city": "New York",
    "state": "NY",
    "coordinates": [-73.9654, 40.7829]
  },
  "lostDate": "2024-03-20",
  "servicePlanId": "60d5ec49c1234567890abcd1"
}
```

### Assignment Endpoints

```
POST   /api/assignments/:id/accept       Accept assignment
GET    /api/assignments/my               Get my assignments
POST   /api/assignments/:id/reject       Reject assignment
GET    /api/assignments/request/:requestId  Get request assignments
```

### Tracking Endpoints

```
POST   /api/tracking/:assignmentId/update   Send location update
GET    /api/tracking/:assignmentId          Get assignment updates
```

**Tracking Update Example:**
```json
{
  "status": "near_location",
  "location": {
    "type": "Point",
    "coordinates": [-73.965, 40.783]
  },
  "message": "Found near the lost location"
}
```

### Evidence Endpoints

```
POST   /api/evidence/:assignmentId/upload     Upload evidence
GET    /api/evidence/:assignmentId            Get evidence
POST   /api/evidence/:evidenceId/verify       Verify evidence (owner)
```

### Payment Endpoints

```
POST   /api/payments/create           Create payment
POST   /api/payments/:id/process      Process payment
POST   /api/payments/:id/release      Release payment (owner)
GET    /api/payments/my               Get my payments
```

### Chat Endpoints

```
POST   /api/chat/:conversationId/send      Send message
GET    /api/chat/:conversationId/messages  Get messages
```

## 🔒 Core Business Rules

### 1. **Payment Escrow System**
- Owner pays full amount when creating request
- Payment status = `locked` (held securely)
- Release only after owner confirms item found
- Refund based on service plan percentage

### 2. **No Direct Contact Rule**
⚠️ **CRITICAL**: Finders CANNOT chat with owners until:
1. Finder uploads evidence (photos/videos)
2. Owner verifies evidence matches item
3. `chatUnlocked` flag set to `true`
4. Only then messages are allowed

### 3. **Tracking Updates**
Finder can send status updates:
- `searching` - Active search in progress
- `near_location` - Found similar item location
- `item_found` - Item possibly found
- `search_failed` - Unable to find item

### 4. **Refund Logic**
- If item not found after expiry → Refund based on service plan
- If owner cancels → Full or partial refund
- Platform fee (10%) deducted from finder rewards

## 📚 Tech Stack

- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File upload middleware
- **Cloudinary** - Cloud storage
- **Nodemailer** - Email service

## 📊 Models Overview

All 13 models with proper relationships:
- User, LostItemRequest, FinderAssignment
- TrackingUpdate, EvidenceFile, Payment
- Refund, Payout, Conversation, Message
- Rating, Dispute, ServicePlan

Each model includes timestamps and is indexed for query performance.

## 🔐 Authentication

All protected endpoints require JWT token:

```
Authorization: Bearer <token>
```

**Roles:**
- `owner` - Post requests, verify evidence, release payments
- `finder` - Accept assignments, upload evidence
- `both` - Full access (default)

## 📧 Email Notifications

Automatically triggered for:
- Registration verification
- Finder assignments
- Evidence uploads
- Item confirmations

## 🎓 For Interviews

**Key Points to Explain:**
1. "Payment escrow protects both parties - money locked until item confirmed"
2. "Evidence verification enforces no-direct-contact rule for safety"
3. "Modular architecture makes adding features straightforward"
4. "Proper indexing ensures queries stay fast as data scales"
5. "Role-based middleware prevents unauthorized access"

## 📝 Environment Variables

Required variables (see `.env.example`):
- `MONGO_URI` - MongoDB connection
- `JWT_SECRET` - Token signing key
- `CLOUDINARY_*` - Image storage
- `SMTP_*` - Email credentials

## 🧪 Testing Workflow

```
1. Register user & login
2. Create lost item request
3. Accept assignment as finder
4. Upload evidence
5. Owner verifies evidence (unlocks chat)
6. Send messages via chat
7. Confirm item found
8. Release payment
```

---

**Production-Ready MERN Backend | Interview Friendly**
