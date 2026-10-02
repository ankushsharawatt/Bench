# Bench 🏦

Bench is a secure, robust backend financial ledger and banking system built with **Node.js, Express, and MongoDB**. 

It implements a strict **double-entry accounting system** (Debit/Credit ledger) and utilizes **ACID-compliant MongoDB transactions** to ensure zero data corruption, prevent double-spending, and maintain financial integrity.

## ✨ Core Features

* **Double-Entry Ledger:** Every transaction creates corresponding DEBIT and CREDIT records, ensuring the sum of all balances across the system always equals zero.
* **ACID Transactions:** Utilizes MongoDB Sessions to lock read/write operations. If a transfer fails at any step, the entire database transaction is rolled back.
* **Idempotency:** Transaction endpoints require a client-generated `idempotencyKey` to prevent double-charging users during network retries or timeouts.
* **System/Treasury Account:** Built-in central banking account with overdraft capabilities to mint and distribute initial funds to users safely.
* **JWT Authentication:** Secure cookie-based authentication with a MongoDB-backed **Token Blacklist** for strict, stateless logouts.
* **Race Condition Prevention:** Balances are read *inside* the locked database session to prevent concurrent double-spend attacks.

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Must be run as a Replica Set or MongoDB Atlas to support ACID transactions)
* **ODM:** Mongoose
* **Authentication:** JSON Web Tokens (JWT) & Cookie Parser

## 📁 Project Structure

```text
bench/
├── src/
│   ├── controller/
│   │   ├── accountcontroller.js     # Account creation & balance logic
│   │   ├── transactioncontroller.js # Core ledger & transfer logic
│   │   └── authcontroller.js        # Login & Blacklist Logout logic
│   ├── middleware/
│   │   └── authmiddleware.js        # JWT verification & Blacklist check
│   ├── models/
│   │   ├── accountmodel.js          # User accounts & Overdraft limits
│   │   ├── ledgermodel.js           # Immutable Debit/Credit entries
│   │   ├── transcationmodel.js      # Idempotent transfer records
│   │   ├── usermodel.js             # User data & passwords
│   │   └── tokenblacklistmodel.js   # Invalidated JWTs with TTL
│   ├── routes/                      # Express route definitions
│   └── services/
│       └── email.service.js         # Async email notifications
└── server.js                        # App entry point
