import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FiPackage, FiTruck, FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/orders/myorders', { params });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="text-yellow-400" />;
      case 'confirmed': return <FiCheck className="text-blue-400" />;
      case 'processing': return <FiPackage className="text-blue-400" />;
      case 'shipped': return <FiTruck className="text-purple-400" />;
      case 'delivered': return <FiCheck className="text-green-400" />;
      case 'cancelled': return <FiX className="text-red-400" />;
      case 'returned': return <FiRefreshCw className="text-orange-400" />;
      default: return <FiClock className="text-dark-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
      case 'confirmed': return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
      case 'processing': return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
      case 'shipped': return 'bg-purple-900/30 text-purple-400 border border-purple-700/50';
      case 'delivered': return 'bg-green-900/30 text-green-400 border border-green-700/50';
      case 'cancelled': return 'bg-red-900/30 text-red-400 border border-red-700/50';
      case 'returned': return 'bg-orange-900/30 text-orange-400 border border-orange-700/50';
      default: return 'bg-dark-700/40 text-dark-300';
    }
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Orders</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50">
            <FiPackage className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">No orders found</p>
            <Link to="/products" className="text-primary-400 hover:text-primary-300 mt-2 block transition-colors">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link 
                key={order._id} 
                to={`/orders/${order._id}`} 
                className="block p-6 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 hover:border-primary-500/30 hover:bg-dark-800/60 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-dark-700/40 rounded-lg flex items-center justify-center">
                      {getStatusIcon(order.orderStatus)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{order.orderNumber}</p>
                      <p className="text-sm text-dark-400">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-dark-400 mt-1">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-white">
                      Rs. {order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Order Items Preview */}
                <div className="mt-4 flex items-center space-x-2 overflow-x-auto">
                  {order.items.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex-shrink-0 w-12 h-12 bg-dark-700/40 rounded overflow-hidden">
                      <img 
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/48'} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-sm text-dark-400">+{order.items.length - 4} more</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
