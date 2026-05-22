import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiTruck, FiPackage, FiMapPin, FiPhone, FiCheckCircle, FiClock, FiLogOut, FiZap } from 'react-icons/fi';

const DeliveryDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/delivery/myorders');
      setOrders(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/delivery-status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Standalone Header with Branding & Logout */}
      <div className="flex items-center justify-between mb-12 pb-6 border-b border-dark-700/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <FiZap className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none">Premier</h2>
            <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">Delivery Partner</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/20 font-medium"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FiTruck className="text-primary-500" />
            <span>Assigned Orders</span>
          </h1>
          <p className="text-gray-400 mt-1">Track and update your current deliveries</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No orders found</h3>
          <p className="text-gray-400 max-w-sm mx-auto">
            You don't have any assigned orders matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order._id} className="card overflow-hidden group hover:border-primary-500/50 transition-all duration-300">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1 block">
                      Order #{order.orderNumber}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {order.user?.name}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    order.orderStatus === 'delivered' ? 'bg-green-500/10 text-green-500' :
                    order.orderStatus === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {order.orderStatus}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <FiMapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-300">
                        {order.shippingAddress.street}
                      </p>
                      <p className="text-sm text-gray-400">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <FiPhone className="w-5 h-5 text-gray-500" />
                    <p className="text-sm text-gray-300">{order.shippingAddress.phone}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiClock className="w-5 h-5 text-gray-500" />
                    <p className="text-sm text-gray-300">
                      Placed: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="border-t border-dark-700 pt-4 mb-6">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Items</p>
                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-lg border-2 border-dark-800 bg-dark-700 overflow-hidden" title={item.name}>
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-10 h-10 rounded-lg border-2 border-dark-800 bg-dark-700 flex items-center justify-center text-xs text-gray-400">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {order.orderStatus !== 'delivered' && (
                    <>
                      {order.orderStatus !== 'shipped' && (
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'shipped')}
                          className="flex-1 btn-primary py-2.5 flex items-center justify-center space-x-2"
                        >
                          <FiTruck className="w-4 h-4" />
                          <span>Mark Shipped</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 border transition-all ${
                          order.orderStatus === 'shipped'
                            ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                            : 'bg-transparent border-dark-600 text-gray-400 hover:text-white hover:border-gray-500'
                        }`}
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Mark Delivered</span>
                      </button>
                    </>
                  )}
                  {order.orderStatus === 'delivered' && (
                    <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl py-3 flex items-center justify-center text-green-500 font-bold space-x-2">
                      <FiCheckCircle />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
