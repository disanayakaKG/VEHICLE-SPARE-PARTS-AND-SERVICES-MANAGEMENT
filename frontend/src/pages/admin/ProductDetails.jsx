import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../../services/api';

const AdminProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/admin/${id}`);
        setProduct(response.data);
      } catch (fetchError) {
        console.error('Error fetching product details:', fetchError);
        setError('Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatField = (value, fallback = '—') => (value || value === 0 ? value : fallback);
  const getFinalPrice = () => {
    if (!product) return null;
    if (product.finalPrice && Number(product.finalPrice) > 0) return Number(product.finalPrice);
    if (product.discount && Number(product.discount) > 0) {
      return Number(product.price || 0) - (Number(product.price || 0) * Number(product.discount) / 100);
    }
    return Number(product.price || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-dark-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-dark-900 border border-dark-700/50 rounded-3xl p-8 text-center">
          <p className="text-lg text-white mb-4">{error || 'Product not found.'}</p>
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-primary inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Products
          </button>
        </div>
      </div>
    );
  }

  const alternativeNames = Array.isArray(product.alternativeNames)
    ? product.alternativeNames
    : typeof product.alternativeNames === 'string'
      ? product.alternativeNames.split(',').map((name) => name.trim()).filter(Boolean)
      : [];

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center rounded-2xl border border-dark-700/50 bg-dark-900 px-4 py-2 text-sm text-white transition hover:border-primary-500"
            >
              <FiArrowLeft className="mr-2" /> Back to Products
            </button>
            <h1 className="mt-4 text-3xl font-bold text-white">Product Details</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="bg-dark-900 border border-dark-700/50 rounded-3xl p-6 shadow-xl shadow-black/20">
            <img
              src={product.image || 'https://via.placeholder.com/560x420?text=No+Image'}
              alt={product.name || 'Product image'}
              className="h-80 w-full rounded-3xl object-cover"
            />
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-dark-400">Status</p>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.isActive ? 'bg-green-900/40 text-green-300 border border-green-700/40' : 'bg-red-900/40 text-red-300 border border-red-700/40'}`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-sm text-dark-400">Stock Quantity</p>
                <p className="text-white text-lg font-semibold">{formatField(product.stockQuantity, 'N/A')}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Warranty Period</p>
                <p className="text-white text-lg font-semibold">{product.warrantyPeriod ? `${product.warrantyPeriod} months` : 'None'}</p>
              </div>
            </div>
          </div>

          <div className="bg-dark-900 border border-dark-700/50 rounded-3xl p-6 shadow-xl shadow-black/20">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-dark-400">Product Name</p>
                <p className="text-white font-semibold">{formatField(product.name)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Product ID</p>
                <p className="text-white font-semibold">{formatField(product.productId)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">OEM / Item Code</p>
                <p className="text-white font-semibold">{formatField(product.itemId)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Category</p>
                <p className="text-white font-semibold">{formatField(product.category)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Brand</p>
                <p className="text-white font-semibold">{formatField(product.brand)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Vehicle Type</p>
                <p className="text-white font-semibold">{formatField(product.vehicleType)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Vehicle Brand</p>
                <p className="text-white font-semibold">{formatField(product.vehicleBrand)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Vehicle Model</p>
                <p className="text-white font-semibold">{formatField(product.vehicleModel)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Price</p>
                <p className="text-white font-semibold">Rs. {Number(product.price || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Discount</p>
                <p className="text-white font-semibold">{product.discount ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Final Price</p>
                <p className="text-white font-semibold">Rs. {Number(getFinalPrice() || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">Years</p>
                <p className="text-white font-semibold">{product.yearFrom ? `${product.yearFrom}` : '—'}{product.yearTo ? ` – ${product.yearTo}` : ''}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-dark-400">Alternative Names</p>
                <p className="text-white font-semibold">{alternativeNames.length > 0 ? alternativeNames.join(', ') : 'None'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-dark-700/50 bg-dark-950/40 p-5">
              <p className="text-sm text-dark-400 mb-2">Description</p>
              <p className="text-white leading-relaxed">{product.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetails;
