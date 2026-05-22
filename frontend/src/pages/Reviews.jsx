import { useState, useEffect } from 'react';
import api from '../services/api';
import { FiStar } from 'react-icons/fi';

const Reviews = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/myorders', { params: { status: 'delivered' } });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Reviews</h1>

        <p className="text-dark-400 mb-6">
          Review products from your delivered orders. Your feedback helps other customers make informed decisions.
        </p>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50">
            <FiStar className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">No delivered orders to review</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{order.orderNumber}</h3>
                    <p className="text-sm text-dark-400">
                      Delivered on {new Date(order.deliveredAt || order.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-dark-700/30 rounded-xl border border-dark-600/30">
                      <img 
                        src={item.product?.images?.[0] || 'https://via.placeholder.com/60'} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-dark-400">Qty: {item.quantity}</p>
                      </div>
                      <a 
                        href={`/products/${item.product?._id || item.product}`}
                        className="btn-secondary text-sm"
                      >
                        Write Review
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
