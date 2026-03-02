# Bitespeed Identity Reconciliation

A backend service that identifies and tracks customer identity across multiple purchases by linking contacts with shared email or phone number.

## Live Endpoint

POST https://your-app-name.onrender.com/identify

> Replace with your actual Render URL after deployment

## Tech Stack

- Runtime: Node.js
- Language: TypeScript
- Framework: Express.js
- Database: PostgreSQL
- ORM: Prisma
- Validation: Zod

## Project Structure

src/
├── config/          # Environment and database setup
├── controllers/     # Request handlers
├── middlewares/     # Validation and error handling
├── repositories/    # Database queries
├── routes/          # API routes
├── schemas/         # Zod validation schemas
├── services/        # Business logic
├── types/           # TypeScript interfaces
└── utils/           # Logger utility

## API

### POST /identify

Accepts an email, phone number, or both and returns the consolidated contact identity.

Request Body:
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}

At least one of email or phoneNumber must be provided.

Response:
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}

## How It Works

Case 1 — No existing contact
Creates a new primary contact and returns it.

Case 2 — Contact exists, new information
Links the new email or phone as a secondary contact under the existing primary.

Case 3 — Two separate clusters linked
Merges both clusters. The older contact stays primary, the newer one is demoted to secondary.

## Local Setup

Prerequisites: Node.js 18+, PostgreSQL

npm install
cp .env.example .env

Update DATABASE_URL in .env:
DATABASE_URL="postgresql://postgres:password@localhost:5432/bitespeed_db?schema=public"

npx prisma generate
npx prisma migrate dev
npm run dev

Server runs at http://localhost:3000

## Environment Variables

NODE_ENV              → development
PORT                  → 3000
API_VERSION           → v1
DATABASE_URL          → required
LOG_LEVEL             → info
DB_TRANSACTION_TIMEOUT → 10000