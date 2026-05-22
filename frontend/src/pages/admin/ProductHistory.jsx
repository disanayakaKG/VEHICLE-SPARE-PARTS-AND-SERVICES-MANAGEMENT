import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { FiArrowLeft, FiSearch, FiRefreshCw } from 'react-icons/fi';

const AdminProductHistory = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [restoring, setRestoring] = useState(new Set()); // Track restoring products by ID
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDeletedPeriod, setSelectedDeletedPeriod] = useState('all');

  useEffect(() => {
    fetchRemovedProducts();
  }, []);

  const fetchRemovedProducts = async () => {
    try {
      // Fetch removed products from the admin endpoint
      const response = await api.get('/products/admin/removed', { params: { limit: 500 } });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching removed products:', error);
      // Fallback if the endpoint fails
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (productId) => {
    if (restoring.has(productId)) return; // Prevent duplicate requests

    setRestoring(prev => new Set(prev).add(productId));

    try {
      await api.patch(`/products/${productId}/restore`);
      // Remove the product from the local state
      setProducts(prev => prev.filter(p => p._id !== productId));
      // Show success message
      toast.success('Product restored successfully!');
    } catch (error) {
      console.error('Error restoring product:', error);
      toast.error('Failed to restore product. Please try again.');
    } finally {
      setRestoring(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  const getDeletedPeriodMatch = (removedDate, period) => {
    if (period === 'all') return true;
    const now = new Date();
    const removed = new Date(removedDate);
    const diffInDays = Math.floor((now - removed) / (1000 * 60 * 60 * 24));

    switch (period) {
      case 'today':
        return removed.toDateString() === now.toDateString();
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return removed.toDateString() === yesterday.toDateString();
      case '1week':
        return diffInDays > 1 && diffInDays <= 7;
      case '2weeks':
        return diffInDays > 7 && diffInDays <= 14;
      case '3weeks':
        return diffInDays > 14 && diffInDays <= 21;
      case '1month':
        return diffInDays > 21 && diffInDays <= 30;
      case 'moreThan1month':
        return diffInDays > 30;
      default:
        return true;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !search ||
      product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.itemId?.toLowerCase().includes(search.toLowerCase()) ||
      product.productId?.toLowerCase().includes(search.toLowerCase()) ||
      product.brand?.toLowerCase().includes(search.toLowerCase()) ||
      product.category?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    const matchesPeriod = getDeletedPeriodMatch(product.removedAt, selectedDeletedPeriod);

    return matchesSearch && matchesCategory && matchesPeriod;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex gap-6">
        <div className="w-64 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">History Panel</h2>
            <p className="text-sm text-dark-400 mt-2">Archive management tools</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Product Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Deleted Period</label>
                <select
                  value={selectedDeletedPeriod}
                  onChange={(e) => setSelectedDeletedPeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm"
                >
                  <option value="all">All Products</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="1week">1 Week Before</option>
                  <option value="2weeks">2 Weeks Before</option>
                  <option value="3weeks">3 Weeks Before</option>
                  <option value="1month">1 Month Before</option>
                  <option value="moreThan1month">More Than 1 Month Before</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                  setSelectedDeletedPeriod('all');
                }}
                className="w-full px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
              title="Back to Products"
            >
              <FiArrowLeft className="w-5 h-5 text-dark-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Product History</h1>
              <p className="text-dark-400 text-sm mt-1">Removed products archive</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 mb-6">
          <div className="p-4 flex items-center">
            <FiSearch className="text-dark-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, category, OEM code, product ID, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full outline-none bg-transparent text-white placeholder-dark-400"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-12 text-center">
            {products.length === 0 ? (
              <>
                <p className="text-dark-400 text-lg">No removed products in history</p>
                <button
                  onClick={() => navigate('/admin/products')}
                  className="text-primary-400 hover:text-primary-300 mt-4 font-medium inline-flex items-center gap-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  Back to Products
                </button>
              </>
            ) : (
              <p className="text-dark-400 text-lg">No products match your search</p>
            )}
          </div>
        ) : (
            <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">OEM Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Final Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Removed Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <img
                          src={typeof product.image === 'string' && product.image.trim() ? product.image : 'https://via.placeholder.com/40?text=No+Image'}
                          alt=""
                          className="w-10 h-10 rounded object-cover mr-3"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                          }}
                        />
                        <div>
                          <p className="font-medium text-white whitespace-nowrap">{product.name || '-'}</p>
                          <p className="text-xs text-dark-400">{product.category || 'No category'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-dark-300 text-xs whitespace-nowrap">{product.productId || '-'}</td>
                    <td className="px-4 py-4 text-dark-300 text-xs font-mono whitespace-nowrap">{product.itemId || '-'}</td>
                    <td className="px-4 py-4 text-dark-300 text-xs whitespace-nowrap">{product.brand || '-'}</td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      <span className="font-medium text-primary-400">
                        Rs. {product.finalPrice ? Number(product.finalPrice).toLocaleString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-dark-400 whitespace-nowrap">
                      {formatDate(product.removedAt)}
                    </td>
                    <td className="px-4 py-4 text-xs whitespace-nowrap">
                      <button
                        onClick={() => handleRestore(product._id)}
                        disabled={restoring.has(product._id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {restoring.has(product._id) ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiRefreshCw className="w-4 h-4" />
                        )}
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        {!loading && filteredProducts.length > 0 && (
          <div className="mt-6 p-4 bg-dark-800/30 rounded-lg border border-dark-700/50">
            <p className="text-sm text-dark-400">
              Showing <span className="font-medium text-white">{filteredProducts.length}</span> removed {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default AdminProductHistory;
