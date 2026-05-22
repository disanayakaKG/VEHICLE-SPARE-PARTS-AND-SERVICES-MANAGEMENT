import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import Reviews from './pages/Reviews';
import Warranty from './pages/Warranty';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Wishlist from './pages/Wishlist';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductHistory from './pages/admin/ProductHistory';
import AdminProductOverview from './pages/admin/ProductOverview';
import AdminProductDetails from './pages/admin/ProductDetails';
import AdminOrders from './pages/admin/Orders';
import AdminServices from './pages/admin/Services';
import AdminBookings from './pages/admin/Bookings';
import AdminInventory from './pages/admin/Inventory';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminReviews from './pages/admin/Reviews';
import AdminWarranty from './pages/admin/Warranty';
import AdminDelivery from './pages/admin/AdminDelivery';

// Protected Route
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SupplierRoute from './components/SupplierRoute';
import DeliveryRoute from './components/DeliveryRoute';
import SupplierDashboard from './pages/supplier/SupplierDashboard';

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardRoute = location.pathname.startsWith('/supplier') || location.pathname === '/delivery-dashboard';

  useEffect(() => {
    if (user && user.role === 'delivery' && location.pathname !== '/delivery-dashboard' && !location.pathname.startsWith('/login')) {
      navigate('/delivery-dashboard', { replace: true });
    }
    
    if (user && user.role === 'supplier' && !location.pathname.startsWith('/supplier') && !location.pathname.startsWith('/login')) {
      navigate('/supplier/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <Navbar />}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Customer Routes */}
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
          <Route path="/warranty" element={<ProtectedRoute><Warranty /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/delivery-dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/history" element={<AdminRoute><AdminProductHistory /></AdminRoute>} />
          <Route path="/admin/products/overview" element={<AdminRoute><AdminProductOverview /></AdminRoute>} />
          <Route path="/admin/products/:id" element={<AdminRoute><AdminProductDetails /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
          <Route path="/admin/suppliers" element={<AdminRoute><AdminSuppliers /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
          <Route path="/admin/warranty" element={<AdminRoute><AdminWarranty /></AdminRoute>} />
          <Route path="/admin/delivery" element={<AdminRoute><AdminDelivery /></AdminRoute>} />

          {/* Supplier Routes */}
          <Route
            path="/supplier/dashboard"
            element={
              <SupplierRoute>
                <SupplierDashboard />
              </SupplierRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
