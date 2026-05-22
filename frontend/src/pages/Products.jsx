import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiStar, FiGrid, FiList } from 'react-icons/fi';
import { BsHeart, BsHeartFill } from 'react-icons/bs';
import api, { getWishlist, addToWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    category: '',
    vehicleType: '',
    brand: '',
    vehicleBrand: '',
    sortBy: 'default',
    minPrice: '',
    maxPrice: '',
    yearFrom: '',
    yearTo: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const yearOptions = Array.from({ length: 51 }, (_, i) => 1990 + i);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchWishlist = async () => {
    try {
      const response = await getWishlist();
      const ids = new Set(response.data.map(p => p._id));
      setWishlisted(ids);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(searchParams);
      const response = await api.get('/products', { params });
      setProducts(response.data.products);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const handleWishlistToggle = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (wishlisted.has(productId)) {
        await removeFromWishlist(productId);
        setWishlisted(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(productId);
        setWishlisted(prev => new Set([...prev, productId]));
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      vehicleType: '',
      brand: '',
      vehicleBrand: '',
      sortBy: 'default',
      minPrice: '',
      maxPrice: '',
      yearFrom: '',
      yearTo: ''
    });
    setSearchTerm('');
  };

  const filteredProducts = products
    .filter((product) => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.vehicleType && product.vehicleType !== filters.vehicleType) return false;
      if (filters.brand && product.brand !== filters.brand) return false;
      if (filters.vehicleBrand && product.vehicleBrand !== filters.vehicleBrand) return false;
      if (filters.minPrice && product.price && product.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && product.price && product.price > parseFloat(filters.maxPrice)) return false;
      const yearFromValue = Number(product.yearFrom);
      const yearToValue = Number(product.yearTo);
      if (filters.yearFrom && (!Number.isFinite(yearFromValue) || yearFromValue < Number(filters.yearFrom))) return false;
      if (filters.yearTo && (!Number.isFinite(yearToValue) || yearToValue > Number(filters.yearTo))) return false;
      if (filters.sortBy === 'discounted' && !(product.price && product.discountPrice && Number(product.discountPrice) < Number(product.price))) return false;
      if (filters.sortBy === 'non_discounted' && (product.price && product.discountPrice && Number(product.discountPrice) < Number(product.price))) return false;

      // Search logic
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matches =
          (product.name && product.name.toLowerCase().includes(term)) ||
          (product.productId && product.productId.toLowerCase().includes(term)) ||
          (product.itemId && product.itemId.toLowerCase().includes(term)) ||
          (product.category && product.category.toLowerCase().includes(term)) ||
          (product.brand && product.brand.toLowerCase().includes(term)) ||
          (product.vehicleBrand && product.vehicleBrand.toLowerCase().includes(term));
        if (!matches) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (filters.sortBy === 'price_low') {
        return (a.price || 0) - (b.price || 0);
      }
      if (filters.sortBy === 'price_high') {
        return (b.price || 0) - (a.price || 0);
      }
      if (filters.sortBy === 'rating_high') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      return 0;
    });

  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return null;
    const discount = ((price - discountPrice) / price) * 100;
    const rounded = Math.round(discount * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: "url('https://images.stockcake.com/public/0/1/d/01da16e4-e37c-417c-beb7-d3f303b1956c_large/garage-workshop-scene-stockcake.jpg')"
      }}
    >
      <div className="absolute inset-0 bg-dark-950/80"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          {/* Filters */}
          <div className="mt-6 mb-6">
            <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Vehicle Type</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.vehicleType}
                  onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {Array.from(new Set(products.map(p => p.vehicleType).filter(Boolean))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Brand</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                >
                  <option value="">All Brands</option>
                  {Array.from(new Set(products.map(p => p.brand).filter(Boolean))).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Vehicle Brand</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.vehicleBrand}
                  onChange={(e) => handleFilterChange('vehicleBrand', e.target.value)}
                >
                  <option value="">All Vehicle Brands</option>
                  {Array.from(new Set(products.map(p => p.vehicleBrand).filter(Boolean))).map(vb => (
                    <option key={vb} value={vb}>{vb}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Year From</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.yearFrom}
                  onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                >
                  <option value="">Any</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Year To</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.yearTo}
                  onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                >
                  <option value="">Any</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Sort By</label>
                <select
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="default">Default Order</option>
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating_high">Rating: High to Low</option>
                  <option value="discounted">Discounted</option>
                  <option value="non_discounted">Non Discounted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Min Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="Min"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Max Price</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="Max"
                />
              </div>
              <div className="flex justify-center items-end">
                <button
                  onClick={handleResetFilters}
                  className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Reset Filters
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-bold text-white">Spare Parts</h1>
            <p className="text-gray-400 mt-1">{pagination.total} products found</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="w-[400px] md:w-[500px] lg:w-[600px] px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
              placeholder="Search by name, product ID, OEM code, category, brand, or vehicle brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Search is applied live, but can add logic if needed
                }
              }}
            />
            <button
              className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
              onClick={() => {
                // Search is applied live, but can add logic if needed
              }}
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
            <div className="flex bg-gray-800 border border-gray-600 rounded-md p-1 ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiGrid className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
                  viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiList className="w-4 h-4" />
                List
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 text-lg">No products found</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <Link key={product._id} to={`/products/${product._id}`} className="card-hover group h-full flex flex-col transform scale-90">
                      <div className="aspect-square bg-dark-700/50 relative overflow-hidden rounded-t-2xl">
                        <img
                          src={typeof product.image === 'string' && product.image.trim() ? product.image : 'https://via.placeholder.com/300?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                          }}
                        />
                        {product.discountPrice && product.price && product.discountPrice < product.price && getDiscountPercentage(product.price, product.discountPrice) && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {getDiscountPercentage(product.price, product.discountPrice)}% OFF
                          </span>
                        )}
                        {product.stockQuantity === 0 && (
                          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                              Sold Out
                            </span>
                          </div>
                        )}
                        {product.stockQuantity > 0 && (
                          <span className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                            In Stock
                          </span>
                        )}
                        {/* Quick Add Button */}
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stockQuantity === 0}
                          className="absolute bottom-4 right-4 w-10 h-10 bg-primary-500 hover:bg-primary-400 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                        >
                          <FiShoppingCart className="w-4 h-4" />
                        </button>
                        {product.brand && (
                          <span className="absolute bottom-3 left-3 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      <div className="p-4 pb-6 min-h-[190px] flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white line-clamp-1 mb-1 group-hover:text-white transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-xs text-primary-400 font-medium mb-3">{product.category}</p>
                            {product.vehicleType && (
                              <p className="text-xs text-gray-400 mb-1">Vehicle Type : <span className="text-white">{product.vehicleType}</span></p>
                            )}
                            {product.itemId && (
                              <p className="text-xs text-gray-400 mb-1">OEM Code : <span className="text-white">{product.itemId}</span></p>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleWishlistToggle(e, product._id)}
                            className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/80 hover:text-pink-400 hover:bg-black/50 transition shrink-0 mt-1"
                          >
                            {wishlisted.has(product._id) ? <BsHeartFill className="w-4 h-4 text-red-500" /> : <BsHeart className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            {product.discountPrice && product.price && product.discountPrice < product.price ? (
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-primary-400">Rs. {product.discountPrice.toLocaleString()}</span>
                                <span className="text-sm text-gray-500 line-through">Rs. {product.price.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="font-bold text-white">Rs. {product.price.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 ml-2">({product.totalReviews})</span>
                        </div>
                        <div className="h-4"></div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <Link key={product._id} to={`/products/${product._id}`} className="block">
                      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/80 transition-colors relative">
                        {product.stockQuantity === 0 && (
                          <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
                            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                              Sold Out
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0 w-28 h-28 overflow-hidden rounded-lg">
                            <img
                              src={typeof product.image === 'string' && product.image.trim() ? product.image : 'https://via.placeholder.com/100?text=No+Image'}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg scale-110"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3 w-fit max-w-full">
                              <h3 className="font-bold text-white text-lg mb-0 line-clamp-1">
                                {product.name}
                              </h3>

                              {product.discountPrice && product.price && product.discountPrice < product.price && getDiscountPercentage(product.price, product.discountPrice) && (
                                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                  {getDiscountPercentage(product.price, product.discountPrice)}% OFF
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 w-fit max-w-full">
                              <p className="text-sm text-primary-400 font-medium mb-0">{product.category}</p>

                              <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                product.stockQuantity > 0
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                  : 'bg-red-500 text-white'
                              }`}>
                                {product.stockQuantity > 0 ? 'In Stock' : 'Sold Out'}
                              </span>
                            </div>

                            {product.vehicleType && (
                              <p className="text-xs text-gray-400 mb-1">
                                Vehicle Type: <span className="text-white">{product.vehicleType}</span>
                              </p>
                            )}

                            {product.itemId && (
                              <p className="text-xs text-gray-400 mb-1">
                                OEM Code: <span className="text-white">{product.itemId}</span>
                              </p>
                            )}

                            <div className="flex items-center gap-3 w-fit max-w-full">
                              <div className="flex items-center">
                                <div className="flex text-yellow-400">
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar
                                      key={i}
                                      className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? 'fill-current' : ''}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-500 ml-2">({product.totalReviews})</span>
                              </div>

                              {product.brand && (
                                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                  {product.brand}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              {product.discountPrice && product.price && product.discountPrice < product.price ? (
                                <div className="flex flex-col items-end">
                                  <span className="font-bold text-primary-400 text-lg">Rs. {product.discountPrice.toLocaleString()}</span>
                                  <span className="text-sm text-gray-500 line-through">Rs. {product.price.toLocaleString()}</span>
                                </div>
                              ) : (
                                <span className="font-bold text-white text-lg">Rs. {product.price.toLocaleString()}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleWishlistToggle(e, product._id)}
                                className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/80 hover:text-pink-400 hover:bg-black/50 transition"
                              >
                                {wishlisted.has(product._id) ? <BsHeartFill className="w-4 h-4 text-red-500" /> : <BsHeart className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => handleAddToCart(e, product)}
                                disabled={product.stockQuantity === 0}
                                className="w-10 h-10 bg-primary-500 hover:bg-primary-400 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                              >
                                <FiShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-12 space-x-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(1, pagination.currentPage - 1);
                      const params = new URLSearchParams(searchParams);
                      params.set('page', newPage);
                      setSearchParams(params);
                    }}
                    disabled={pagination.currentPage === 1}
                    className={`px-4 h-10 rounded-xl font-medium transition-all duration-200 ${
                      pagination.currentPage === 1
                        ? 'bg-dark-700/30 text-gray-600 cursor-not-allowed'
                        : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white border border-dark-600/50'
                    }`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams);
                        params.set('page', page);
                        setSearchParams(params);
                      }}
                      className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${pagination.currentPage === page
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white border border-dark-600/50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const newPage = Math.min(pagination.totalPages, pagination.currentPage + 1);
                      const params = new URLSearchParams(searchParams);
                      params.set('page', newPage);
                      setSearchParams(params);
                    }}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`px-4 h-10 rounded-xl font-medium transition-all duration-200 ${
                      pagination.currentPage === pagination.totalPages
                        ? 'bg-dark-700/30 text-gray-600 cursor-not-allowed'
                        : 'bg-dark-700/50 text-gray-400 hover:bg-dark-600 hover:text-white border border-dark-600/50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
