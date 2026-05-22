# AutoParts Pro - Vehicle Spare Parts Management System

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application for managing vehicle spare parts, services, and customer operations.

## Team Members & Modules

| Module | Responsible | Student ID |
|--------|-------------|------------|
| Order and Delivery Management | Dilka K.B.T | IT24101143 |
| Feedback and Warranty Management | Ramanayaka R A S S | IT24103406 |
| Supplier Management | Maryshalini. A | IT24100683 |
| Spare Parts/Product Management | Deshan S.M.K | IT24104190 |
| Service and Booking Management | Disanayaka K.G.G.S | IT24102031 |
| Stocks and Inventory Management | Jayakody J.A.K.S.S | IT24100778 |

## Features

### Customer Features
- Browse and search spare parts by category, vehicle type, brand
- Add products to cart and checkout
- Track orders and delivery status
- Book vehicle services online
- Submit product reviews and ratings
- File warranty claims

### Admin Features
- Manage products, inventory, and suppliers
- Process orders and update delivery status
- Manage service bookings
- Moderate customer reviews
- Handle warranty claims
- View dashboard with business insights

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
cd "my project"
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

Edit the `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autoparts_db
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

For MongoDB Atlas, use your connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/autoparts_db
```

## Running the Application

### Start MongoDB (if using local installation)
```bash
mongod
```

### Start Backend Server
```bash
cd backend
npm run dev
```
The server will run on http://localhost:5000

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:3000

## Project Structure

```
my project/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── supplierController.js
│   │   ├── inventoryController.js
│   │   ├── serviceController.js
│   │   ├── bookingController.js
│   │   ├── reviewController.js
│   │   └── warrantyController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Supplier.js
│   │   ├── Inventory.js
│   │   ├── Service.js
│   │   ├── Booking.js
│   │   ├── Review.js
│   │   └── Warranty.js
│   ├── routes/
│   │   └── [all route files]
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AdminRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Warranty.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Products.jsx
│   │   │       ├── Orders.jsx
│   │   │       ├── Services.jsx
│   │   │       ├── Bookings.jsx
│   │   │       ├── Inventory.jsx
│   │   │       ├── Suppliers.jsx
│   │   │       ├── Reviews.jsx
│   │   │       └── Warranty.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update profile

### Products
- GET `/api/products` - Get all products
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (Admin)
- PUT `/api/products/:id` - Update product (Admin)
- DELETE `/api/products/:id` - Delete product (Admin)

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/myorders` - Get user's orders
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/status` - Update order status (Admin)
- PUT `/api/orders/:id/cancel` - Cancel order

### Services & Bookings
- GET `/api/services` - Get all services
- POST `/api/bookings` - Create booking
- GET `/api/bookings/mybookings` - Get user's bookings

### Reviews & Warranty
- POST `/api/reviews` - Submit review
- POST `/api/warranty` - Submit warranty claim

## Creating Admin User

To create an admin user, register a normal user first, then update the role in MongoDB:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Technologies Used

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18 with Vite
- React Router v6
- Tailwind CSS
- Axios for API calls
- React Hot Toast for notifications
- React Icons

## Discount Codes (for testing)
- `SAVE10` - 10% discount
- `SAVE20` - 20% discount
