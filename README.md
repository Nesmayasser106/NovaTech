# NovaTech E-Commerce

A production-quality, full-stack e-commerce system for electronic devices.
Built with **Node.js + Express** backend, **Vanilla HTML/CSS/JS** frontend,
and support for both **MongoDB** and **JSON file** storage.

---

##  Project Structure

```
ecommerce/
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── seed.js                ← Database seeding script
│   ├── .env.example           ← Environment config template
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js            ← POST /api/auth/register, /login
│   │   ├── products.js        ← GET /api/products, /products/:id
│   │   └── orders.js          ← POST /api/orders, GET /api/orders
│   ├── models/                ← Mongoose schemas (MongoDB mode)
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── middleware/
│   │   ├── auth.js            ← JWT generation & verification
│   │   ├── database.js        ← MongoDB/JSON dual adapter
│   │   └── db.js              ← JSON file read/write helpers
│   └── data/
│       └── db.json            ← JSON database file
└── frontend/
    ├── index.html             ← Home / Hero / Featured
    ├── products.html          ← Product listing with filters
    ├── product-details.html   ← Single product view
    ├── cart.html              ← Cart + inline checkout
    ├── checkout.html          ← Dedicated checkout page
    ├── auth.html              ← Login / Register
    ├── orders.html            ← Order history
    ├── about.html             ← About page
    ├── css/
    │   └── main.css           ← Full design system
    └── js/
        └── main.js            ← Shared JS: API, Cart, Auth, UI
```

---

##  Quick Start

### Option A — JSON Storage (No database needed)

```bash
cd backend
npm install
npm run seed      # Populate products
npm start         # Start server
```

Open **http://localhost:3000**

---

### Option B — MongoDB

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set MONGODB_URI
npm run seed      # Seeds products to MongoDB
npm start
```

---

##  API Reference

### Auth

| Method | Endpoint              | Auth | Description        |
|--------|-----------------------|------|--------------------|
| POST   | /api/auth/register    | No   | Create account     |
| POST   | /api/auth/login       | No   | Login, get JWT     |
| GET    | /api/auth/me          | JWT  | Get current user   |

**Register body:**
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response:**
```json
{ "token": "eyJ...", "user": { "id": "...", "name": "Jane Doe", "email": "..." } }
```

---

### Products

| Method | Endpoint            | Auth | Description              |
|--------|---------------------|------|--------------------------|
| GET    | /api/products       | No   | List (filter/sort/search)|
| GET    | /api/products/:id   | No   | Product detail + related |

**Query params:** `category`, `search`, `sort` (`price-asc`, `price-desc`, `rating`, `name`), `limit`

---

### Orders

| Method | Endpoint    | Auth | Description         |
|--------|-------------|------|---------------------|
| POST   | /api/orders | JWT  | Place order         |
| GET    | /api/orders | JWT  | Get user's orders   |

**Checkout body:**
```json
{
  "items": [{ "id": "p1", "quantity": 2 }],
  "shipping": { "name": "Jane", "address": "123 Main St", "city": "NYC", "zip": "10001" },
  "paymentMethod": "card"
}
```

---

##  Design System

CSS variables defined in `frontend/css/main.css`:

```css
--primary:   #990FFA   (violet)
--secondary: #E60076   (pink)
--gradient:  linear-gradient(135deg, #990FFA, #E60076)
--surface:   #FFFFFF
--text:      #111827
```

Fonts: **Syne** (headings) + **DM Sans** (body) via Google Fonts

---

##  Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- Authentication via **JWT** (7-day expiry)
- Protected routes require `Authorization: Bearer <token>`
- Input validation on all endpoints
- CORS configured (set `CORS_ORIGIN` in production)

---

## 🌐 Frontend Pages

| Page              | URL               | Description                        |
|-------------------|-------------------|------------------------------------|
| Home              | /                 | Hero, categories, featured products|
| Products          | /products         | All products with search + filters |
| Product Detail    | /product-details  | Full product info, add to cart     |
| Cart              | /cart             | Cart review + quick checkout       |
| Checkout          | /checkout         | Dedicated checkout with forms      |
| Auth              | /auth             | Login / Register tabs              |
| Orders            | /orders           | Order history (auth required)      |
| About             | /about            | Company info + team                |

---

##  Features

-  User registration & login (JWT)
-  Product listing from database (not static)
-  Search & category filtering
-  Shopping cart (localStorage)
-  Checkout with shipping & payment forms
-  Order placement & storage
-  Order history per user
-  Toast notifications
-  Loading spinners
-  Fully responsive (mobile-first)
-  MongoDB + JSON dual storage
-  Mongoose models (User, Product, Order)

---

##  Environment Variables

| Variable      | Default                        | Description              |
|---------------|--------------------------------|--------------------------|
| PORT          | 3000                           | Server port              |
| MONGODB_URI   | (not set → JSON mode)          | MongoDB connection string|
| JWT_SECRET    | gradient_ecommerce_secret_2024 | JWT signing secret       |
| CORS_ORIGIN   | *                              | Allowed CORS origins     |
| NODE_ENV      | development                    | Environment              |

---

##  Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS        |
| Backend    | Node.js, Express.js            |
| Database   | MongoDB (Mongoose) / JSON file |
| Auth       | JWT + bcrypt                   |
| Fonts      | Google Fonts (Syne + DM Sans)  |
| Images     | Unsplash (via URL)             |

---

##  License

MIT — free for personal and commercial use.
