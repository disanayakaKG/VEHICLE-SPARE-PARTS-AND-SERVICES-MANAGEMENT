import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { FiPackage, FiShoppingCart, FiUsers, FiCalendar, FiTruck, FiAlertCircle, FiDollarSign, FiTrendingUp } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    lowStockItems: 0,
    pendingReviews: 0,
    pendingWarranty: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, bookingsRes, inventoryRes, reviewsRes, warrantyRes] = await Promise.all([
        api.get('/orders'),
        api.get('/bookings'),
        api.get('/inventory/alerts'),
        api.get('/reviews', { params: { isApproved: false } }),
        api.get('/warranty', { params: { status: 'pending' } })
      ]);

      const orders = ordersRes.data.orders;
      const totalRevenue = orders
        .filter(o => o.orderStatus === 'delivered')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        totalOrders: ordersRes.data.total,
        pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
        totalBookings: bookingsRes.data.total,
        pendingBookings: bookingsRes.data.bookings.filter(b => b.status === 'pending').length,
        lowStockItems: inventoryRes.data.length,
        pendingReviews: reviewsRes.data.total,
        pendingWarranty: warrantyRes.data.total,
        totalRevenue
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: FiShoppingCart, color: 'blue', link: '/admin/orders' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: FiPackage, color: 'yellow', link: '/admin/orders?status=pending' },
    { title: 'Today\'s Bookings', value: stats.pendingBookings, icon: FiCalendar, color: 'purple', link: '/admin/bookings' },
    { title: 'Low Stock Alerts', value: stats.lowStockItems, icon: FiAlertCircle, color: 'red', link: '/admin/inventory' },
    { title: 'Pending Reviews', value: stats.pendingReviews, icon: FiUsers, color: 'green', link: '/admin/reviews' },
    { title: 'Warranty Claims', value: stats.pendingWarranty, icon: FiTruck, color: 'orange', link: '/admin/warranty' },
  ];

  const colorClasses = {
    blue: 'bg-blue-900/30 text-blue-400',
    yellow: 'bg-yellow-900/30 text-yellow-400',
    purple: 'bg-purple-900/30 text-purple-400',
    red: 'bg-red-900/30 text-red-400',
    green: 'bg-green-900/30 text-green-400',
    orange: 'bg-orange-900/30 text-orange-400',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-dark-400">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm">Total Revenue</p>
              <p className="text-4xl font-bold mt-1">Rs. {stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Link 
              key={index} 
              to={stat.link} 
              className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[stat.color]}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-dark-400">{stat.title}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/admin/products" className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FiPackage className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-medium text-white">Manage Products</span>
          </Link>
          <Link to="/admin/inventory" className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-medium text-white">Inventory</span>
          </Link>
          <Link to="/admin/suppliers" className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FiTruck className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-medium text-white">Suppliers</span>
          </Link>
          <Link to="/admin/services" className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-medium text-white">Services</span>
          </Link>
          <Link to="/admin/delivery" className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4 hover:border-primary-500/30 transition-all duration-300 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-900/30 rounded-lg flex items-center justify-center">
              <FiTruck className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-medium text-white">Delivery Management</span>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
          <div className="p-6 border-b border-dark-700/50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
              <Link to="/admin/orders" className="text-primary-400 hover:text-primary-300 text-sm transition-colors">View All</Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/orders`} className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{order.user?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize border ${
                        order.orderStatus === 'delivered' ? 'bg-green-900/30 text-green-400 border-green-700/50' :
                        order.orderStatus === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' :
                        order.orderStatus === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-700/50' :
                        'bg-blue-900/30 text-blue-400 border-blue-700/50'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">Rs. {order.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-dark-400 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
