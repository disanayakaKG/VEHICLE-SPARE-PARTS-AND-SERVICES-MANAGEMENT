import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiShare2, FiCheck, FiTruck, FiShield, FiStar, FiChevronRight, FiX } from 'react-icons/fi';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [eligibility, setEligibility] = useState({ eligible: false, message: '' });
  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return null;
    const discount = ((price - discountPrice) / price) * 100;
    const rounded = Math.round(discount * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (user) {
      checkEligibility();
    }
  }, [id, user]);

  const checkEligibility = async () => {
    try {
      const response = await api.get(`/reviews/eligibility/${id}?type=product`);
      setEligibility(response.data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/product/${id}`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    /* 
      ==========================================================================
      FRONTEND VALIDATION - REVIEW SUBMISSION FORM
      ==========================================================================
      - Rating: Mandatory (1-5 stars).
      - Title: Required, 3-100 characters.
      - Comment: Required, 10-2000 characters.
      ==========================================================================
    */

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      toast.error('Please select a rating between 1 and 5 stars');
      return;
    }

    if (!reviewForm.title || reviewForm.title.trim().length < 3) {
      toast.error('Please provide a title (at least 3 characters)');
      return;
    }

    if (reviewForm.title.length > 100) {
      toast.error('Title is too long (maximum 100 characters)');
      return;
    }

    if (!reviewForm.comment || reviewForm.comment.trim().length < 10) {
      toast.error('Please provide a more detailed review (at least 10 characters)');
      return;
    }

    if (reviewForm.comment.length > 2000) {
      toast.error('Review comment is too long (maximum 2000 characters)');
      return;
    }

    try {
      await api.post('/reviews', {
        product: id,
        ...reviewForm
      });
      toast.success('Review submitted for approval');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Product not found</h2>
          <Link to="/products" className="text-primary-400 hover:text-primary-300 mt-4 block transition-colors">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const stock = Number(product?.stockQuantity || 0);
  const oemCode = product?.itemId || product?.oemCode || '-';
  const alternativeNames = Array.isArray(product?.alternativeNames)
    ? product.alternativeNames.filter(Boolean).join(', ') || '-'
    : product?.alternativeNames || '-';
  const yearRange = product?.yearFrom || product?.yearTo
    ? `${product.yearFrom || '-'}${product.yearTo ? ` - ${product.yearTo}` : ''}`
    : '-';
  const hasDiscount =
    product?.price != null &&
    product?.discountPrice != null &&
    Number.isFinite(Number(product.discountPrice)) &&
    Number(product.discountPrice) < Number(product.price);
  const originalPrice = product?.price != null ? `Rs. ${product.price.toLocaleString()}` : '-';
  const finalPrice = hasDiscount
    ? `Rs. ${product.discountPrice.toLocaleString()}`
    : originalPrice;
  const discountLabel = hasDiscount
    ? `${getDiscountPercentage(product.price, product.discountPrice)}%`
    : '-';

  const handleAddToCart = () => {
    if (stock < quantity) {
      toast.error('Not enough stock');
      return;
    }
    addToCart(product, quantity);
    toast.success('Added to cart');
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-8">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="text-dark-400 hover:text-primary-400 transition-colors">Home</Link></li>
            <li><FiChevronRight className="text-dark-600 w-4 h-4" /></li>
            <li><Link to="/products" className="text-dark-400 hover:text-primary-400 transition-colors">Products</Link></li>
            <li><FiChevronRight className="text-dark-600 w-4 h-4" /></li>
            <li className="text-white font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-dark-800/50 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden mb-4 shadow-xl">
              <img
                src={typeof product.image === 'string' && product.image.trim() ? product.image : 'https://via.placeholder.com/600?text=No+Image'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600?text=No+Image';
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-primary-500/20 text-primary-400 text-sm font-medium rounded-full mb-3">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-white mb-3">{product.name}</h1>
              <div className="flex items-center flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.round(product.averageRating))}
                    {'☆'.repeat(5 - Math.round(product.averageRating))}
                  </div>
                  <span className="ml-2 text-dark-400">({product.totalReviews} reviews)</span>
                </div>
                <span className="text-dark-600">|</span>
                <span className="text-dark-400">Part #: <span className="text-dark-300">{product.partNumber}</span></span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 bg-dark-800/30 rounded-xl border border-dark-700/50">
              {hasDiscount ? (
                <div className="flex items-center flex-wrap gap-4">
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent">
                    Rs. {product.discountPrice.toLocaleString()}
                  </span>
                  <span className="text-xl text-dark-500 line-through">Rs. {product.price.toLocaleString()}</span>
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {discountLabel} OFF
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-white">Rs. {product.price.toLocaleString()}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {stock > 10 ? (
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center text-accent-400 bg-accent-500/10 px-4 py-2 rounded-full w-fit">
                    <FiCheck className="mr-2" /> In Stock
                  </span>
                  <p className="text-sm text-dark-400 ml-4 font-medium">{stock} units ready for immediate shipping</p>
                </div>
              ) : stock > 0 ? (
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center text-orange-400 bg-orange-500/10 px-4 py-2 rounded-full w-fit animate-pulse">
                    <FiCheck className="mr-2" /> Limited Stock Available
                  </span>
                  <p className="text-sm text-orange-400/80 ml-4 font-bold">Hurry! Only {stock} items remaining</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="inline-flex items-center text-red-400 bg-red-500/10 px-4 py-2 rounded-full w-fit font-bold border border-red-500/20">
                    <FiX className="mr-2" /> SOLD OUT
                  </span>
                  <p className="text-sm text-dark-500 ml-4">We are restockng soon. Check back later!</p>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="bg-dark-800/40 backdrop-blur-xl rounded-xl border border-dark-700/50 p-5 mb-6">
              <h3 className="font-semibold text-white mb-5 flex items-center">
                <FiShield className="mr-2 text-primary-400" /> Product Details
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm text-dark-200">
                <div className="space-y-3">
                  <div>
                    <span className="text-dark-400">Product Name:</span> <span>{product.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">OEM / Item Code:</span> <span>{oemCode || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Brand:</span> <span>{product.brand || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Vehicle Brand:</span> <span>{product.vehicleBrand || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Price:</span> <span>{originalPrice}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Final Price:</span> <span>{finalPrice}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Alternative Names:</span> <span>{alternativeNames}</span>
                  </div>
                </div>
                <div className="space-y-3">
                    <div>
                    <span className="text-dark-400">Category:</span> <span>{product.category || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Vehicle Type:</span> <span>{product.vehicleType || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Vehicle Model:</span> <span>{product.vehicleModel || '-'}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Discount:</span> <span>{discountLabel}</span>
                  </div>
                  <div>
                    <span className="text-dark-400">Years:</span> <span>{yearRange}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                >-</button>
                <span className="px-5 py-3 font-medium text-white bg-dark-800/50">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                  className="px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                >+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-3 rounded-xl font-semibold 
                         hover:from-primary-500 hover:to-primary-400 transition-all duration-300 shadow-lg shadow-primary-500/25
                         disabled:from-dark-600 disabled:to-dark-600 disabled:shadow-none disabled:cursor-not-allowed
                         inline-flex items-center justify-center"
              >
                <FiShoppingCart className="mr-2" /> Add to Cart
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-dark-300 bg-dark-800/30 p-3 rounded-xl border border-dark-700/30">
                <FiTruck className="w-5 h-5 text-primary-400" />
                <span className="text-sm">Free shipping over Rs. 5,000</span>
              </div>
              <div className="flex items-center gap-3 text-dark-300 bg-dark-800/30 p-3 rounded-xl border border-dark-700/30">
                <FiShield className="w-5 h-5 text-accent-400" />
                <span className="text-sm">
                  {Number(product.warrantyPeriod) > 0
                    ? `${product.warrantyPeriod} months warranty`
                    : 'Warranty not available'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-dark-700/50 pt-6">
              <h3 className="font-semibold text-lg text-white mb-3">Description</h3>
              <p className="text-dark-300 whitespace-pre-line leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
            {user && (
              <div className="flex flex-col items-end">
                {eligibility.eligible ? (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-500 transition-all duration-300 shadow-lg shadow-primary-500/20"
                  >
                    {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                  </button>
                ) : (
                  <div className="text-right">
                    <p className="text-sm text-dark-400 font-medium">
                      {eligibility.message || 'Only verified purchasers can leave reviews'}
                    </p>
                    {eligibility.purchased && eligibility.alreadyReviewed && (
                      <p className="text-xs text-primary-400 mt-1 italic">Thank you for your feedback!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 mb-8">
              <h3 className="font-semibold text-lg text-white mb-6">Write Your Review</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`text-3xl transition-colors ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-dark-600 hover:text-dark-500'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                {/*FRONTEND VALIDATION - REVIEW TITLE*/}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className={`w-full px-4 py-3 bg-dark-900/50 border rounded-xl text-white placeholder-dark-500 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${reviewForm.title.length > 100 ? 'border-red-500' : 'border-dark-700'}`}
                    placeholder="Summary of your review"
                  />
                  <div className="flex justify-between mt-1">
                    <p className={`text-xs ${reviewForm.title.length < 3 && reviewForm.title.length > 0 ? 'text-orange-400' : 'text-dark-500'}`}>
                      {reviewForm.title.length < 3 && reviewForm.title.length > 0 ? 'Minimum 3 characters required' : ''}
                    </p>
                    <p className={`text-xs ${reviewForm.title.length > 100 ? 'text-red-500' : 'text-dark-500'}`}>
                      {reviewForm.title.length}/100
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Review</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className={`w-full px-4 py-3 bg-dark-900/50 border rounded-xl text-white placeholder-dark-500 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all resize-none ${reviewForm.comment.length > 2000 ? 'border-red-500' : 'border-dark-700'}`}
                    rows={4}
                    placeholder="Share your experience..."
                    required
                  />
                  <div className="flex justify-between mt-1">
                    <p className={`text-xs ${reviewForm.comment.length < 10 && reviewForm.comment.length > 0 ? 'text-orange-400' : 'text-dark-500'}`}>
                      {reviewForm.comment.length < 10 && reviewForm.comment.length > 0 ? 'Minimum 10 characters required' : ''}
                    </p>
                    <p className={`text-xs ${reviewForm.comment.length > 2000 ? 'text-red-500' : 'text-dark-500'}`}>
                      {reviewForm.comment.length}/2000
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-6 py-2.5 rounded-xl font-medium 
                             hover:from-primary-500 hover:to-primary-400 transition-all duration-300 shadow-lg shadow-primary-500/25"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-6 py-2.5 border border-dark-600 text-dark-300 rounded-xl hover:bg-dark-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-dark-800/30 rounded-2xl border border-dark-700/50">
              <FiStar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
              <p className="text-dark-400">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{review.user?.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-white">{review.user?.name}</span>
                          {review.isVerifiedPurchase && (
                            <span className="ml-2 bg-accent-500/20 text-accent-400 text-xs px-2 py-0.5 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-2 ml-13">
                        <div className="flex text-yellow-400 text-sm">
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(5 - review.rating)}
                        </div>
                        <span className="text-dark-500 text-sm ml-3">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.title && <h4 className="font-medium text-white mb-2">{review.title}</h4>}
                  <p className="text-dark-300 leading-relaxed">{review.comment}</p>
                  {review.adminResponse && (
                    <div className="mt-4 bg-dark-900/50 p-4 rounded-xl border border-dark-700/30">
                      <p className="text-sm font-medium text-primary-400 mb-1">Response from AutoParts Pro</p>
                      <p className="text-sm text-dark-300">{review.adminResponse.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
