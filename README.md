# Inventory & Order Management System

## Project Overview

This project is a full-stack Inventory and Order Management System developed as part of the AasaMedChem Hackathon Assignment.

The system enables:

* User and Admin authentication
* Product inventory management
* Product search and filtering
* Unit conversion (kg↔g, L↔mL, item)
* Order placement
* Order approval workflow
* Inventory tracking
* Role-based access control

The application is built using Next.js, Prisma ORM, and Neon PostgreSQL, and is designed to handle inventory, quotations, and order management efficiently.

---

# Features

## Authentication & Authorization

### User

* Register account
* Login
* Browse products
* Place orders
* View own orders only

### Admin

* Login
* Manage products
* View all orders
* Approve orders
* Reject orders
* Mark orders as completed
* Monitor inventory

---

## Product Management

Admin can:

* Create products
* Update products
* Delete products
* Manage stock quantities
* Configure pricing
* Configure base units

Product Information:

* Product Name
* Description
* SKU
* Base Unit
* Price
* Stock Quantity

---

## Product Search & Filtering

Features:

* Search by product name
* Debounced search for better performance
* Filter by dimension

Dimensions:

* Weight
* Volume
* Count

---

## Order Management

Users can:

* Select products
* Choose quantity
* Select unit
* Preview pricing
* Place orders

Admins can:

* View all orders
* Approve orders
* Reject orders
* Complete orders

Order Status Flow:

PENDING → APPROVED → COMPLETED

or

PENDING → REJECTED

---

## Inventory Management

Inventory automatically updates when orders are approved.

Example:

Initial Stock:

50,000 mL

Approved Order:

2 L

Converted Quantity:

2,000 mL

Remaining Stock:

48,000 mL

---

# Tech Stack

## Frontend

* Next.js 15
* React
* TypeScript
* Tailwind CSS

## Backend

* Next.js API Routes
* Prisma ORM

## Database

* Neon PostgreSQL

## Authentication

* JWT Authentication
* Role-Based Access Control

## Deployment

* Vercel

---

# Database Design

## User

| Field     | Type         |
| --------- | ------------ |
| id        | UUID         |
| name      | String       |
| email     | String       |
| password  | String       |
| role      | USER / ADMIN |
| createdAt | DateTime     |

---

## Product

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| name          | String  |
| description   | String  |
| sku           | String  |
| dimension     | String  |
| baseUnit      | String  |
| basePrice     | Decimal |
| stockQuantity | Decimal |

---

## Order

| Field       | Type     |
| ----------- | -------- |
| id          | UUID     |
| userId      | UUID     |
| totalAmount | Decimal  |
| status      | String   |
| createdAt   | DateTime |

---

## OrderItem

| Field     | Type    |
| --------- | ------- |
| id        | UUID    |
| orderId   | UUID    |
| productId | UUID    |
| quantity  | Decimal |
| unit      | String  |
| price     | Decimal |
| subtotal  | Decimal |

---

# System Architecture

User
↓
Authentication
↓
Browse Products
↓
Search / Filter
↓
Place Order
↓
Unit Conversion
↓
Price Calculation
↓
Create Order
↓
Admin Review
↓
Approve / Reject
↓
Inventory Update
↓
Order Completion

---

# Unit Conversion Strategy

## Internal Storage

To maintain consistency, all quantities are stored using base units.

### Weight

Stored as:

g (grams)

Conversions:

* 1 kg = 1000 g
* 500 g = 500 g

---

### Volume

Stored as:

mL (milliliters)

Conversions:

* 1 L = 1000 mL
* 500 mL = 500 mL

---

### Count

Stored as:

item

Conversions:

* 1 item = 1 item

---

# Pricing Strategy

All prices are stored using base units.

Example:

Product:

Acetone

Base Unit:

mL

Base Price:

₹2 per mL

Order:

2 L

Conversion:

2 L → 2000 mL

Calculation:

2000 × 2

Total:

₹4000

---

# Why PostgreSQL?

PostgreSQL was selected because:

* ACID compliant
* Strong relational modeling
* Supports complex queries
* High reliability
* Supports precise Decimal values
* Ideal for inventory and financial calculations

---

# Why Decimal Instead of Float?

Prices and quantities require high precision.

Float may introduce rounding errors.

Decimal ensures:

* Accurate financial calculations
* Reliable inventory calculations
* Consistent order totals

---

# API Routes

## Authentication

POST /api/auth/register

POST /api/auth/login

---

## Products

GET /api/products

POST /api/products

PUT /api/products/:id

DELETE /api/products/:id

---

## Orders

GET /api/orders

POST /api/orders

PATCH /api/orders/:id

---

# Installation

Clone Repository

```bash
git clone <repository-url>
```

Navigate to Project

```bash
cd inventory-management
```

Install Dependencies

```bash
npm install
```

Configure Environment Variables

```env
DATABASE_URL=your_neon_database_url

JWT_SECRET=your_jwt_secret
```

Run Database Migration

```bash
npx prisma migrate dev
```

Generate Prisma Client

```bash
npx prisma generate
```

Start Development Server

```bash
npm run dev
```

Application URL

```text
http://localhost:3000
```

---

# Deployment

The application is deployed using Vercel.

Deployment Steps:

1. Push code to GitHub
2. Import repository into Vercel
3. Add environment variables
4. Deploy

---

# Test Credentials

Admin Account

Email:
[admin@test.com](mailto:admin@test.com)

Password:
admin123

User Account

Email:
[user@test.com](mailto:user@test.com)

Password:
user123

---

# Future Improvements

* Email notifications
* Quotation PDF generation
* Order export functionality
* Product categories
* Inventory alerts
* Analytics dashboard
* Bulk product upload

---

# Author

Ritik Raj

B.Tech Computer Science and Engineering

Lovely Professional University

Built as part of the AasaMedChem Full Stack Development Assignment.
