import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { BsHeartFill } from 'react-icons/bs';
import { getWishlist, removeFromWishlist } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const response = await getWishlist();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
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

  const handleRemoveFromWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFromWishlist(productId);
      setProducts(products.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

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
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-white">My Wishlist</h1>
          <p className="text-gray-400 mt-1">{products.length} products saved</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiHeart className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">Your wishlist is empty</p>
            <p className="text-gray-500 mt-2">Add products you like to your wishlist</p>
            <Link to="/products" className="inline-block mt-4 bg-primary-500 hover:bg-primary-400 text-white px-6 py-2 rounded-md">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product._id} to={`/products/${product._id}`} className="card-hover group h-full flex flex-col">
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
                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={product.stockQuantity === 0}
                    className="absolute bottom-3 right-3 w-10 h-10 bg-primary-500 hover:bg-primary-400 disabled:bg-dark-600 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
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
                      onClick={(e) => handleRemoveFromWishlist(e, product._id)}
                      className="w-9 h-9 rounded-full bg-black/30 border border-white/10 flex items-center justify-center text-white/80 hover:text-pink-400 hover:bg-black/50 transition shrink-0 mt-1"
                    >
                      <BsHeartFill className="w-4 h-4" />
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
        )}
      </div>
    </div>
  );
};

export default Wishlist;