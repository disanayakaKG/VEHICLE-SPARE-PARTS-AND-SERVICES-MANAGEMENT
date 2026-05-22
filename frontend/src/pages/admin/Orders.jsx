import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiTruck, FiPhone, FiUser } from 'react-icons/fi';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/orders', { params });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, status, additionalData = {}) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: status, ...additionalData });
      toast.success('Order updated');
      fetchOrders();
      if (selectedOrder) {
        // Refresh order details if modal is open
        const response = await api.get(`/orders/${orderId}`);
        setSelectedOrder(response.data);
      }
    } catch (error) {
      toast.error('Error updating order');
    }
  };


  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50',
      confirmed: 'bg-blue-900/30 text-blue-400 border border-blue-700/50',
      processing: 'bg-blue-900/30 text-blue-400 border border-blue-700/50',
      shipped: 'bg-purple-900/30 text-purple-400 border border-purple-700/50',
      delivered: 'bg-green-900/30 text-green-400 border border-green-700/50',
      cancelled: 'bg-red-900/30 text-red-400 border border-red-700/50',
    };
    return colors[status] || 'bg-dark-700/40 text-dark-300';
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-48">
            <option value="">All Orders</option>
            {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-white">{order.user?.name}</p>
                      <p className="text-sm text-dark-400">{order.user?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{order.items.length} items</td>
                    <td className="px-6 py-4 font-medium text-white">Rs. {order.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedOrder(order)} className="text-primary-400 hover:text-primary-300 transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Order {selectedOrder.orderNumber}</h2>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-dark-400 flex items-center gap-1 mb-1">
                        <FiUser className="text-primary-500" /> Customer
                      </p>
                      <p className="font-medium text-white">{selectedOrder.user?.name}</p>
                      <p className="text-sm text-dark-300">{selectedOrder.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-dark-400 flex items-center gap-1 mb-1">
                        <FiTruck className="text-primary-500" /> Shipping Address
                      </p>
                      <p className="text-sm text-dark-300">{selectedOrder.shippingAddress?.street}</p>
                      <p className="text-sm text-dark-300">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                    </div>
                    {selectedOrder.deliveryPerson && (
                      <div className="animate-fade-in">
                        <p className="text-sm text-dark-400 flex items-center gap-1 mb-1">
                          <FiTruck className="text-green-500" /> Delivery Partner
                        </p>
                        <p className="font-medium text-white">{selectedOrder.deliveryPerson.name}</p>
                        <p className="text-sm text-dark-300 flex items-center gap-1 mt-0.5">
                          <FiPhone className="text-primary-400 w-3 h-3" />
                          {selectedOrder.deliveryPerson.phone || 'No phone'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-dark-400 mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between bg-dark-800/40 border border-dark-700/30 p-3 rounded-xl">
                          <span className="text-dark-200">{item.name} x {item.quantity}</span>
                          <span className="font-medium text-white">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between font-semibold text-lg border-t border-dark-700/50 pt-4">
                    <span className="text-white">Total</span>
                    <span className="text-white">Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-dark-700/50 pt-4">
                  {selectedOrder.orderStatus === 'pending' && (
                    <div className="mb-4">
                      <button
                        onClick={() => handleUpdateStatus(selectedOrder._id, 'confirmed')}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        <FiCheck className="text-xl" /> Approve Order
                      </button>
                    </div>
                  )}
                  <p className="text-sm font-medium text-dark-300 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedOrder._id, status)}
                        disabled={selectedOrder.orderStatus === status}
                        className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${selectedOrder.orderStatus === status
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-700/50 text-dark-300 hover:bg-dark-700 hover:text-white border border-dark-600'
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
