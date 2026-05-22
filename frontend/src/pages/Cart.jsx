import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shippingCost = getCartTotal() > 5000 ? 0 : 300;
  const total = getCartTotal() + shippingCost;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-dark-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShoppingBag className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 mb-8">Add some products to your cart to continue shopping</p>
          <Link to="/products" className="btn-primary inline-flex items-center">
            Browse Products <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div key={item._id} className="card p-4 flex items-center space-x-4">
              <Link to={`/products/${item._id}`} className="flex-shrink-0">
                <img 
                  src={item.images?.[0] || 'https://via.placeholder.com/100'} 
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-xl bg-dark-700"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item._id}`} className="font-medium text-white hover:text-primary-400 transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center bg-dark-700/50 rounded-xl border border-dark-600/50">
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="p-2.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <FiMinus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-medium text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="p-2.5 text-gray-400 hover:text-white transition-colors"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      Rs. {((item.discountPrice || item.price) * item.quantity).toLocaleString()}
                    </p>
                    {item.discountPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item._id)}
                className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button onClick={clearCart} className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                <span className="text-white">Rs. {getCartTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-accent-400' : 'text-white'}>
                  {shippingCost === 0 ? 'Free' : `Rs. ${shippingCost}`}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-sm text-accent-400">
                  Add Rs. {(5000 - getCartTotal()).toLocaleString()} more for free shipping!
                </p>
              )}
              <hr className="border-dark-600/50" />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-white">Total</span>
                <span className="text-primary-400">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Discount Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">Discount Code</label>
              <div className="flex space-x-2">
                <input type="text" placeholder="Enter code" className="input-field flex-1" />
                <button className="btn-secondary">Apply</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Try: SAVE10, SAVE20</p>
            </div>

            <button onClick={handleCheckout} className="btn-primary w-full">
              Proceed to Checkout
            </button>

            <Link to="/products" className="block text-center text-primary-400 hover:text-primary-300 mt-4 font-medium transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
