# Bitespeed Identity Reconciliation

A backend service built for the Bitespeed backend task. It identifies and keeps track of a customer's identity across multiple purchases by linking contacts that share an email or phone number.

## 🚀 Live Endpoint
```
POST https://bitespeed-assesment-cq32.onrender.com/identify
```

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod

## Project Structure
```
src/
├── config/          
├── controllers/     
├── middlewares/     
├── repositories/    
├── routes/          
├── schemas/         
├── services/        
├── types/           
└── utils/           
```

## API Reference

### POST /identify

Receives a checkout event with email or phone number and returns the consolidated contact.

**Request Body** (JSON — not form-data)
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

At least one of `email` or `phoneNumber` must be provided. Both can be sent together.

**Success Response — 200**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

**Error Response — 400**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "At least one of email or phoneNumber is required"
    }
  ]
}
```

## How It Works

The service handles three reconciliation cases:

**Case 1 — No existing contact**
Both email and phone are unknown. Creates a new primary contact and returns it with empty secondaryContactIds.

**Case 2 — Matches one existing cluster**
One field matches an existing contact but the other is new. Creates a secondary contact linked to the existing primary.

**Case 3 — Matches two separate clusters**
The request bridges two previously separate identities. Merges them — the older contact stays primary, the newer one is demoted to secondary. All secondaries are re-linked to the winner.

## Example Scenarios

**New customer — creates primary:**
```json
{ "email": "lorraine@hillvalley.edu", "phoneNumber": "123456" }
```

**Same phone, new email — creates secondary:**
```json
{ "email": "mcfly@hillvalley.edu", "phoneNumber": "123456" }
```

**Bridges two clusters — triggers merge:**
```json
{ "email": "george@hillvalley.edu", "phoneNumber": "717171" }
```

**Lookup by email only:**
```json
{ "email": "lorraine@hillvalley.edu" }
```

**Lookup by phone only:**
```json
{ "phoneNumber": "123456" }
```

## Local Setup

**Prerequisites**
- Node.js 18+
- PostgreSQL

**Installation**
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/bitespeed_db?schema=public"
```
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Server runs at `http://localhost:3000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `API_VERSION` | API version | `v1` |
| `DATABASE_URL` | PostgreSQL connection string | required |
| `LOG_LEVEL` | Logging level | `info` |
| `DB_TRANSACTION_TIMEOUT` | Max transaction time in ms | `10000` |

## Deployment

Hosted on **Render.com** with a managed PostgreSQL database.

Build Command:
```
npm install && ./node_modules/.bin/prisma generate && npm run build
```

Start Command:
```
./node_modules/.bin/prisma migrate deploy && node dist/server.js

```

