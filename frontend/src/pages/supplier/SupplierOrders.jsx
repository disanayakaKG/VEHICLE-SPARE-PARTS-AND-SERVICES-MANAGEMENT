import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SupplierOrders = () => {
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockRequests();
  }, []);

  const fetchStockRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/my/stock-requests');
      setStockRequests(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch stock requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await api.put(`/suppliers/my/stock-requests/${requestId}/status`, { status: newStatus });
      toast.success(`Stock request ${newStatus}. Go to My Products to see updated stock!`);
      fetchStockRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">Pending</span>;
      case 'accepted':
      case 'approved':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Accepted</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">Rejected</span>;
      case 'dispatched':
      case 'ordered':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">Dispatched</span>;
      case 'shipped':
        return <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium">Shipped</span>;
      case 'received':
        return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">Received</span>;
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">Low</span>;
      case 'normal':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">Normal</span>;
      case 'high':
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">High</span>;
      case 'urgent':
        return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">Urgent</span>;
      default:
        return <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-sm font-medium">{priority}</span>;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : stockRequests.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">No stock requests yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Request ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Priority</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {stockRequests.map((request) => (
                <tr key={request._id} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 text-white font-mono text-sm">{request.requestNumber || request._id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {request.product?.name || 'Product'}
                  </td>
                  <td className="px-6 py-4 text-white">{request.requestedQuantity}</td>
                  <td className="px-6 py-4">{getPriorityBadge(request.priority)}</td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(request.createdAt)}</td>
                  <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(request._id, 'approved')}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm font-medium hover:bg-green-500/30 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(request._id, 'cancelled')}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium hover:bg-red-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleStatusUpdate(request._id, 'ordered')}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          Dispatch
                        </button>
                      )}
                      {request.status !== 'pending' && request.status !== 'accepted' && (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;
