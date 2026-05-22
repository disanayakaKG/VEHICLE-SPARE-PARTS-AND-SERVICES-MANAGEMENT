import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiSettings, FiPackage, FiCalendar, FiZap, FiShield, FiTruck } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="flex items-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Creative SVG Logo */}
                <svg viewBox="0 0 100 100" className="w-full h-full transform group-hover:rotate-12 transition-transform duration-500">
                  <defs>
                    <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Outer Gear */}
                  <path
                    d="M50 15 L55 5 L65 10 L60 20 A30 30 0 0 1 80 40 L90 35 L95 45 L85 50 A30 30 0 0 1 80 60 L90 65 L85 75 L75 70 A30 30 0 0 1 60 80 L65 90 L55 95 L50 85 A30 30 0 0 1 40 80 L35 90 L25 85 L30 75 A30 30 0 0 1 20 60 L10 65 L5 55 L15 50 A30 30 0 0 1 20 40 L10 35 L15 25 L25 30 A30 30 0 0 1 40 20 L35 10 L45 5 L50 15 Z"
                    fill="url(#logo-grad)"
                  />
                  {/* Inner Car Silhouette */}
                  <path
                    d="M35 55 Q35 45 45 42 L65 42 Q75 45 75 55 L78 55 L78 62 L32 62 L32 55 Z M42 62 A3 3 0 0 1 48 62 M62 62 A3 3 0 0 1 68 62"
                    fill="rgba(15, 23, 42, 0.9)"
                  />
                </svg>
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div className="ml-3 flex flex-col leading-tight">
                <span className="font-bold text-xl tracking-tight text-white uppercase group-hover:text-yellow-400 transition-colors">
                  Premier
                </span>
                <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-[0.3em]">
                  Parts Supply
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/products" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
              Products
            </Link>
            <Link to="/services" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
              Services
            </Link>
            {user && (
              <>
                <Link to="/orders" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
                  My Orders
                </Link>
                <Link to="/bookings" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
                  My Bookings
                </Link>
                <Link to="/warranty" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
                   Warranty Claim
                </Link>
                <Link to="/wishlist" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200">
                  My Wishlist
                </Link>
                {user.role === 'delivery' && (
                  <Link to="/delivery-dashboard" className="px-4 py-2 text-primary-400 hover:text-primary-300 hover:bg-dark-700/50 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                    <FiTruck className="w-4 h-4" />
                    <span>Delivery Dashboard</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Cart */}
            <Link to="/cart" className="relative p-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200">
              <FiShoppingCart className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-lg shadow-primary-500/30">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Quick links on mobile */}
            {user && (
              <div className="md:hidden flex items-center space-x-1">
                <Link
                  to="/orders"
                  className="p-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200"
                  title="My Orders"
                >
                  <FiPackage className="w-5 h-5" />
                </Link>
                <Link
                  to="/bookings"
                  className="p-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200"
                  title="My Bookings"
                >
                  <FiCalendar className="w-5 h-5" />
                </Link>
                <Link
                  to="/warranty"
                  className="p-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200"
                  title="Warranty Claim"
                >
                  <FiShield className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-dark-700/50 transition-all duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="hidden sm:block text-gray-200 font-medium">{user.name?.split(' ')[0]}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-dark-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-dark-600/50 py-2 z-50">
                    <div className="px-4 py-2 border-b border-dark-600/50">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiPackage className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiCalendar className="w-4 h-4" />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/warranty"
                      className="flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiShield className="w-4 h-4" />
                       <span>Warranty Claim</span>
                    </Link>
                    {user.role === 'delivery' && (
                      <Link
                        to="/delivery-dashboard"
                        className="flex items-center space-x-3 px-4 py-2.5 text-primary-400 hover:text-primary-300 hover:bg-dark-700/50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiTruck className="w-4 h-4" />
                        <span>Delivery Dashboard</span>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-2.5 text-primary-400 hover:text-primary-300 hover:bg-dark-700/50 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <FiSettings className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <hr className="my-2 border-dark-600/50" />
                    <button
                      onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                      className="flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-dark-700/50 w-full transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors px-4 py-2">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg transition-colors"
            >
              {isMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-700/50">
            <div className="flex flex-col space-y-1">
              <Link to="/products" className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                Products
              </Link>
              <Link to="/services" className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                Services
              </Link>
              {user && (
                <>
                  <Link to="/orders" className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                    My Orders
                  </Link>
                  <Link to="/bookings" className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                    My Bookings
                  </Link>
                  <Link to="/warranty" className="px-4 py-2.5 text-gray-300 hover:text-white hover:bg-dark-700/50 rounded-lg font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
                     Warranty Claim
                  </Link>
                  {user.role === 'delivery' && (
                    <Link to="/delivery-dashboard" className="px-4 py-2.5 text-primary-400 hover:text-primary-300 hover:bg-dark-700/50 rounded-lg font-medium transition-colors flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                      <FiTruck className="w-4 h-4" />
                      <span>Delivery Dashboard</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
