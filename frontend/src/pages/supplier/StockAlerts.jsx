import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiPlus } from 'react-icons/fi';
import api from '../../services/api';

const StockAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    note: '',
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/my/alerts');
      setAlerts(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (productId) => {
    setSelectedProductId(productId);
    setFormData({ quantity: '', note: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProductId(null);
    setFormData({ quantity: '', note: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/suppliers/my/restock', {
        productId: selectedProductId,
        quantity: parseInt(formData.quantity),
        note: formData.note,
      });
      toast.success('Restock request sent');
      handleCloseModal();
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error sending restock request');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Stock Alerts</h1>
        <p className="text-gray-400 mt-2">Products with stock below 5 units</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <FiAlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">All products are well stocked!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alerts.map((product) => (
            <div key={product._id} className="card p-6 border-l-4 border-yellow-500">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{product.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{product.category}</p>
                </div>
                <FiAlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              </div>

              <div className="mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-gray-400 text-sm">Current Stock</span>
                  <span className="text-2xl font-bold text-yellow-400">{product.countInStock}</span>
                </div>
                <div className="text-gray-500 text-xs">units remaining</div>
              </div>

              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                  Low Stock
                </span>
              </div>

              <button
                onClick={() => handleOpenModal(product._id)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors font-medium"
              >
                <FiPlus className="w-4 h-4" />
                <span>Request Restock</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Request Restock</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity (units)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="input-field"
                  placeholder="Enter quantity"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Note (optional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="input-field"
                  placeholder="Add any notes about this request"
                  rows="3"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlerts;
