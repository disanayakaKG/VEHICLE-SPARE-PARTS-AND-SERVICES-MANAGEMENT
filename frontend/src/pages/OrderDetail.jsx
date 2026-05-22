import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiPackage, FiTruck, FiCheck, FiMapPin, FiCreditCard, FiShield, FiAlertCircle, FiPhone, FiLock } from 'react-icons/fi';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.put(`/orders/${id}/cancel`, { reason: 'Customer requested cancellation' });
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleRequestReturn = async () => {
    const reason = prompt('Please provide a reason for return:');
    if (!reason) return;
    try {
      await api.put(`/orders/${id}/return`, { reason });
      toast.success('Return request submitted');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request return');
    }
  };

  // ── PayHere SDK loader ────────────────────────────────────────────────────
  const loadPayhereScript = () =>
    new Promise((resolve, reject) => {
      if (window.payhere) return resolve();
      const existing = document.getElementById('payhere-script');
      if (existing) {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.id    = 'payhere-script';
      script.src   = 'https://www.payhere.lk/lib/payhere.js';
      script.async = true;
      script.onload  = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  // ── Pay Now for card orders with pending payment ──────────────────────────
  const handlePayNow = async () => {
    setPaying(true);
    try {
      const hashRes = await api.post('/payments/order-hash', { orderId: id });
      const params  = hashRes.data;

      await loadPayhereScript();

      window.payhere.onCompleted = async (phOrderId) => {
        try {
          await api.post('/payments/confirm', { orderId: phOrderId, paymentId: phOrderId, type: 'order' });
        } catch (_) { /* webhook will handle */ }
        toast.success('Payment successful! Order confirmed. 🎉');
        fetchOrder(); // refresh to show updated payment status
      };

      window.payhere.onDismissed = () => {
        toast('Payment cancelled. Click Pay Now anytime to try again.', {
          icon: '⚠️',
          style: { background: '#1e1e2e', color: '#fff' }
        });
      };

      window.payhere.onError = (error) => {
        toast.error('PayHere error: ' + error);
      };

      // 🚀 Launch the PayHere payment popup
      window.payhere.sandbox = true;
      window.payhere.startPayment({
        sandbox:     true,
        merchant_id: params.merchant_id,
        return_url:  params.return_url,
        cancel_url:  params.cancel_url,
        notify_url:  params.notify_url,
        order_id:    params.order_id,
        items:       params.items,
        amount:      params.amount,
        currency:    params.currency,
        hash:        params.hash,
        first_name:  params.first_name,
        last_name:   params.last_name,
        email:       params.email,
        phone:       params.phone,
        address:     params.address,
        city:        params.city,
        country:     params.country,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/orders/${id}/invoice`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const getStepStatus = (step) => {
    const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(order.orderStatus);
    const stepIndex = steps.indexOf(step);

    if (order.orderStatus === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Order not found</h2>
          <Link to="/orders" className="text-primary-400 hover:text-primary-300 mt-4 block transition-colors">View all orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link to="/orders" className="text-primary-400 hover:text-primary-300 text-sm mb-2 block transition-colors">&larr; Back to Orders</Link>
            <h1 className="text-3xl font-bold text-white">Order {order.orderNumber}</h1>
            <p className="text-dark-400">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div className="text-right flex flex-col gap-2">
            <button onClick={handleDownloadInvoice} className="btn-secondary">Download Invoice</button>
            {order.orderStatus === 'pending' && (
              <button onClick={handleCancelOrder} className="btn-danger">Cancel Order</button>
            )}
            {order.orderStatus === 'delivered' && order.returnStatus === 'none' && (
              <button onClick={handleRequestReturn} className="btn-secondary">Request Return</button>
            )}
          </div>
        </div>

        {/* Order Timeline */}
        {order.orderStatus !== 'cancelled' && (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 mb-8">
            <h2 className="font-semibold text-lg text-white mb-6">Order Status</h2>
            <div className="flex justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-dark-700 -z-10"></div>
              {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, index) => {
                const status = getStepStatus(step);
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'current' ? 'bg-primary-600 text-white' :
                        'bg-dark-700 text-dark-400'
                      }`}>
                      {status === 'completed' ? <FiCheck /> : index + 1}
                    </div>
                    <span className={`text-xs mt-2 capitalize ${status === 'current' ? 'font-semibold text-primary-400' : 'text-dark-400'
                      }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.trackingNumber && (
              <p className="text-sm text-dark-300 mt-6">
                Tracking Number: <span className="font-medium text-white">{order.trackingNumber}</span>
              </p>
            )}
            {order.estimatedDelivery && (
              <p className="text-sm text-dark-300 mt-2">
                Estimated Delivery: <span className="text-white">{new Date(order.estimatedDelivery).toLocaleDateString()}</span>
              </p>
            )}
          </div>
        )}

        {order.orderStatus === 'cancelled' && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-8">
            <p className="text-red-400 font-medium">This order has been cancelled</p>
            {order.notes && <p className="text-red-300 text-sm mt-1">Reason: {order.notes}</p>}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Items */}
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
            <h2 className="font-semibold text-lg text-white mb-4 flex items-center">
              <FiPackage className="mr-2 text-primary-400" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <img
                    src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-dark-400">Qty: {item.quantity}</p>
                    {order.orderStatus === 'delivered' && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-dark-500 flex items-center gap-1">
                          <FiShield className="text-primary-500" />
                          {item.product?.warrantyPeriod || 0} Months Warranty
                        </span>
                        <Link
                          to={`/warranty?orderId=${order._id}&productId=${item.product?._id || item.product}`}
                          className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Claim Warranty
                        </Link>
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-white">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="space-y-6">
            <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
              <h2 className="font-semibold text-lg text-white mb-4 flex items-center">
                <FiMapPin className="mr-2 text-primary-400" /> Shipping Address
              </h2>
              <p className="text-dark-300">
                {order.shippingAddress.street}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                Phone: {order.shippingAddress.phone}
              </p>
            </div>

            {order.deliveryPerson && (
              <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 shadow-lg shadow-primary-500/5 animate-fade-in">
                <h2 className="font-semibold text-lg text-white mb-4 flex items-center">
                  <FiTruck className="mr-2 text-primary-400" /> Delivery Partner
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
                    <FiTruck className="text-primary-400 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{order.deliveryPerson.name}</p>
                    <p className="text-dark-400 text-sm flex items-center gap-1">
                      <FiPhone className="text-primary-500 w-3 h-3" />
                      {order.deliveryPerson.phone || 'No contact provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
              <h2 className="font-semibold text-lg text-white mb-4 flex items-center">
                <FiCreditCard className="mr-2 text-primary-400" /> Payment
              </h2>
              <div className="space-y-2 text-dark-300">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="capitalize text-white">{order.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className={`capitalize font-medium ${
                    order.paymentStatus === 'completed' ? 'text-green-400' :
                    order.paymentStatus === 'failed'    ? 'text-red-400'   :
                    'text-yellow-400'
                  }`}>
                    {order.paymentStatus === 'completed' ? '✅ Paid' :
                     order.paymentStatus === 'failed'    ? '❌ Failed' :
                     '⚠️ Pending'}
                  </span>
                </div>

                {/* Pay Now button for card orders that are still unpaid */}
                {order.paymentMethod === 'card' &&
                 order.paymentStatus !== 'completed' &&
                 !['cancelled'].includes(order.orderStatus) && (
                  <div className="pt-3 mt-2 border-t border-dark-700">
                    <button
                      onClick={handlePayNow}
                      disabled={paying}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl font-semibold
                               hover:from-primary-500 hover:to-primary-400 transition-all duration-300 shadow-lg shadow-primary-500/25
                               disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> Opening PayHere...</>
                      ) : (
                        <><FiCreditCard className="w-4 h-4" /> Pay Now via PayHere</>
                      )}
                    </button>
                    <p className="text-xs text-dark-500 text-center mt-2 flex items-center justify-center gap-1">
                      <FiLock className="w-3 h-3" /> Secured by PayHere · Visa · Mastercard
                    </p>
                  </div>
                )}
                <hr className="my-2 border-dark-700" />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white">Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span>-Rs. {order.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">{order.shippingCost === 0 ? 'Free' : `Rs. ${order.shippingCost}`}</span>
                </div>
                <hr className="my-2 border-dark-700" />
                <div className="flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>Rs. {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
