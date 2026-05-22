import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlus, FiActivity, FiPackage, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';
import ProductManagementSidebar from '../../components/ProductManagementSidebar';

const AdminProductOverview = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ total: 0, active: 0, deactivated: 0 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await api.get('/products/admin/all', { params: { limit: 5000 } });
        const productsData = response.data.products || [];
        const total = response.data.total || 0;
        const activeCount = productsData.filter(p => p.isAvailable).length;
        const deactivatedCount = productsData.filter(p => !p.isAvailable).length;
        setProducts(productsData);
        setCounts({ total, active: activeCount, deactivated: deactivatedCount });
      } catch (error) {
        console.error('Error fetching product counts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ProductManagementSidebar active="overview" />
          <main className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Product Overview</h1>
                <p className="mt-2 text-sm text-dark-400">Quick summary of the product management module</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-500/20 bg-dark-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiPackage className="text-blue-400 text-lg" />
                  <p className="text-sm text-dark-400">Total Products</p>
                </div>
                <p className="text-3xl font-semibold text-blue-400">{loading ? '--' : counts.total}</p>
              </div>
              <div className="rounded-2xl border border-green-500/20 bg-dark-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiCheckCircle className="text-green-400 text-lg" />
                  <p className="text-sm text-dark-400">Active Products</p>
                </div>
                <p className="text-3xl font-semibold text-green-400">{loading ? '--' : counts.active}</p>
              </div>
              <div className="rounded-2xl border border-orange-500/20 bg-dark-900 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiAlertCircle className="text-orange-400 text-lg" />
                  <p className="text-sm text-dark-400">Deactivated Products</p>
                </div>
                <p className="text-3xl font-semibold text-orange-400">{loading ? '--' : counts.deactivated}</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-dark-700/50 bg-dark-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recently Added Products</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-dark-400 border-b border-dark-700/30 pb-2">
                    <div>Product</div>
                    <div>Category</div>
                    <div>Brand</div>
                    <div>Status</div>
                  </div>
                  {loading ? (
                    <p className="text-dark-400">Loading...</p>
                  ) : (
                    products.slice(-5).reverse().map((product, index) => (
                      <div key={product._id || index} className="grid grid-cols-4 gap-4 py-3 border-b border-dark-700/20 last:border-b-0">
                        <div className="space-y-1">
                          <div className="text-white font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-dark-400">{product.productId}</div>
                          <div className="text-xs text-dark-500">{product.itemId}</div>
                        </div>
                        <div className="text-dark-300 text-sm">{product.category}</div>
                        <div className="text-dark-300 text-sm">{product.brand}</div>
                        <div>
                          <span className={`px-2.5 py-0.5 text-xs rounded-full border ${
                            product.isAvailable
                              ? 'bg-transparent text-green-400 border-green-700/50'
                              : 'bg-transparent text-orange-400 border-orange-700/50'
                          }`}>
                            {product.isAvailable ? 'Activated' : 'Deactivated'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-dark-700/50 bg-dark-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Existing Product Categories and Brands in System</h3>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-dark-400">Loading...</p>
                  ) : (
                    Object.entries(
                      products.reduce((acc, product) => {
                        if (!acc[product.category]) {
                          acc[product.category] = new Set();
                        }
                        acc[product.category].add(product.brand);
                        return acc;
                      }, {})
                    ).map(([category, brands]) => (
                      <div key={category} className="border-b border-dark-700/30 pb-3 last:border-b-0">
                        <p className="text-white font-medium mb-2">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(brands).map(brand => (
                            <span key={brand} className="text-sm text-dark-400 bg-dark-800 px-2 py-1 rounded">
                              {brand}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminProductOverview;
