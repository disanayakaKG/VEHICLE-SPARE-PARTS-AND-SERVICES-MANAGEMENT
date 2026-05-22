import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../../services/api';

const MyProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [adminProducts, setAdminProducts] = useState([]);
  const [formData, setFormData] = useState({
    baseProduct: '',
    name: '',
    category: '',
    price: '',
    stockQuantity: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    brand: '',
    itemId: '',
  });

  const categories = ['Engine Parts', 'Brake System', 'Electrical', 'Suspension', 'Body Parts', 'Other'];
  const vehicleTypes = ['Car', 'Van', 'Bike', 'SUV', 'Lorry', 'Bus', 'Pickup', 'Three Wheeler', 'Tractor', 'Electric Vehicle'];

  useEffect(() => {
    fetchProducts();
    fetchAdminProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/my/products');
      setProducts(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const response = await api.get('/products/admin-list');
      setAdminProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to fetch admin products');
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingId(product._id);
      setFormData({
        baseProduct: product.baseProduct || '',
        name: product.name,
        category: product.category,
        price: product.price,
        stockQuantity: product.stockQuantity,
        vehicleType: product.vehicleType || '',
        vehicleBrand: product.vehicleBrand || '',
        vehicleModel: product.vehicleModel || '',
        brand: product.brand || '',
        itemId: product.itemId || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        baseProduct: '',
        name: '',
        category: '',
        price: '',
        stockQuantity: '',
        vehicleType: '',
        vehicleBrand: '',
        vehicleModel: '',
        brand: '',
        itemId: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      baseProduct: '',
      name: '',
      category: '',
      price: '',
      stockQuantity: '',
      vehicleType: '',
      vehicleBrand: '',
      vehicleModel: '',
      brand: '',
      itemId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/suppliers/my/products/${editingId}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/suppliers/my/products', formData);
        toast.success('Product added successfully');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/suppliers/my/products/${id}`);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting product');
    }
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">Out of Stock</span>;
    } else if (stock < 5) {
      return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">Low Stock</span>;
    } else {
      return <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">In Stock</span>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">My Products</h1>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-lg">No products yet. Click "Add Product" to get started.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Item ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Price (LKR)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 text-white font-mono text-sm">{product.productId}</td>
                  <td className="px-6 py-4 text-white font-mono text-sm">{product.itemId}</td>
                  <td className="px-6 py-4 text-white">{product.name}</td>
                  <td className="px-6 py-4 text-gray-400">{product.category}</td>
                  <td className="px-6 py-4 text-white">₨ {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-white">{product.stockQuantity} units</td>
                  <td className="px-6 py-4">{getStockBadge(product.stockQuantity)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
            </div>
            <div className="px-8 pb-8 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                    <select
                      value={formData.baseProduct}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedProduct = adminProducts.find(p => p._id === selectedId);
                        if (selectedProduct) {
                          setFormData({
                            ...formData,
                            baseProduct: selectedId,
                            name: selectedProduct.name,
                            category: selectedProduct.category,
                            vehicleType: selectedProduct.vehicleType,
                            vehicleBrand: selectedProduct.vehicleBrand,
                            vehicleModel: selectedProduct.vehicleModel,
                            brand: selectedProduct.brand,
                          });
                        } else {
                          setFormData({
                            ...formData,
                            baseProduct: '',
                            name: '',
                            category: '',
                            vehicleType: '',
                            vehicleBrand: '',
                            vehicleModel: '',
                            brand: '',
                          });
                        }
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">Select Product</option>
                      {adminProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                      disabled={!!formData.baseProduct}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price (LKR)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="input-field"
                      disabled={!!formData.baseProduct}
                      required
                    >
                      <option value="">Select vehicle type</option>
                      {vehicleTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Brand</label>
                    <input
                      type="text"
                      value={formData.vehicleBrand}
                      onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                      className="input-field"
                      readOnly={!!formData.baseProduct}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Model</label>
                    <input
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="input-field"
                      readOnly={!!formData.baseProduct}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="input-field"
                      readOnly={!!formData.baseProduct}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Item ID</label>
                    <input
                      type="text"
                      value={formData.itemId}
                      onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
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
                    {editingId ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
