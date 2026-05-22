const crypto = require('crypto');
const Booking = require('../models/Booking');
const Order   = require('../models/Order');

// ─── Helper: MD5 hash using Node built-in crypto (no extra package needed) ────
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

// ─── Helper: build PayHere hash per official spec ─────────────────────────────
// hash = UPPER(MD5(merchant_id + order_id + amount + currency + UPPER(MD5(merchant_secret))))
const buildHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  const hashedSecret = md5(merchantSecret).toUpperCase();
  return md5(`${merchantId}${orderId}${amount}${currency}${hashedSecret}`).toUpperCase();
};

// ─── Helper: build address string from User address object ────────────────────
const buildAddressLine = (userAddress) => {
  if (!userAddress) return 'Colombo, Sri Lanka';
  return [userAddress.street, userAddress.city, userAddress.state].filter(Boolean).join(', ') || 'Colombo, Sri Lanka';
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate PayHere hash + checkout params for a BOOKING
// @route   POST /api/payments/hash
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const generatePaymentHash = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('service', 'name');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ message: 'This booking has already been paid' });

    // Generate a unique PayHere order ID for this payment attempt
    const orderId = `BK-PAY-${booking._id}-${Date.now()}`;
    booking.payhereOrderId = orderId;
    await booking.save();

    const amount       = booking.totalPrice.toFixed(2);
    const currency     = 'LKR';
    const merchantId   = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const hash = buildHash(merchantId, orderId, amount, currency, merchantSecret);

    const userAddress  = req.user.address;
    const addressLine  = buildAddressLine(userAddress);
    const userCity     = userAddress?.city || 'Colombo';

    // Debug: log PayHere parameters to help diagnose issues
    console.log('📦 PayHere BOOKING hash params:', { merchantId, orderId, amount, currency, hash: hash.substring(0,8)+'...' });

    res.json({
      merchant_id:  merchantId,
      order_id:     orderId,
      amount,
      currency,
      hash,
      sandbox:      true,
      items:        booking.service?.name || 'Vehicle Service',
      first_name:   req.user.name?.split(' ')[0] || 'Customer',
      last_name:    req.user.name?.split(' ').slice(1).join(' ') || 'Customer',
      email:        req.user.email,
      phone:        req.user.phone || '0771234567',
      address:      addressLine,
      city:         userCity,
      country:      'Sri Lanka',
      return_url:   `${process.env.FRONTEND_URL}/bookings`,
      cancel_url:   `${process.env.FRONTEND_URL}/bookings`,
      notify_url:   process.env.PAYHERE_NOTIFY_URL,
    });
  } catch (error) {
    console.error('PayHere booking hash error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Generate PayHere hash + checkout params for an ORDER (product purchase)
// @route   POST /api/payments/order-hash
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const generateOrderPaymentHash = async (req, res) => {
  try {
    const { orderId: orderDbId } = req.body;

    const order = await Order.findById(orderDbId).populate('items.product', 'name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (order.paymentStatus === 'completed')
      return res.status(400).json({ message: 'This order has already been paid' });

    // Use a unique PayHere order ID with a clear prefix
    const payhereId = `ORD-PAY-${order._id.toString().slice(-8)}-${Date.now().toString().slice(-6)}`;
    order.payhereOrderId = payhereId;
    await order.save();

    const amount         = order.totalAmount.toFixed(2);
    const currency       = 'LKR';
    const merchantId     = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const hash = buildHash(merchantId, payhereId, amount, currency, merchantSecret);

    // Debug: log PayHere parameters
    console.log('📦 PayHere ORDER hash params:', { merchantId, orderId: payhereId, amount, currency, hash: hash.substring(0,8)+'...' });

    // Build items description from order items
    const itemsDesc = order.items.map(i => i.name || i.product?.name || 'Item').join(', ').slice(0, 200);

    const shippingAddr = order.shippingAddress;
    const addressLine  = shippingAddr
      ? [shippingAddr.street, shippingAddr.city, shippingAddr.state].filter(Boolean).join(', ')
      : buildAddressLine(req.user.address);
    const userCity = shippingAddr?.city || req.user.address?.city || 'Colombo';

    res.json({
      merchant_id:  merchantId,
      order_id:     payhereId,
      amount,
      currency,
      hash,
      sandbox:      true,
      items:        itemsDesc || 'Auto Parts Order',
      first_name:   req.user.name?.split(' ')[0] || 'Customer',
      last_name:    req.user.name?.split(' ').slice(1).join(' ') || 'User',
      email:        req.user.email,
      phone:        shippingAddr?.phone || req.user.phone || '0771234567',
      address:      addressLine,
      city:         userCity,
      country:      'Sri Lanka',
      return_url:   `${process.env.FRONTEND_URL}/orders/${order._id}`,
      cancel_url:   `${process.env.FRONTEND_URL}/orders/${order._id}`,
      notify_url:   process.env.PAYHERE_NOTIFY_URL,
    });
  } catch (error) {
    console.error('PayHere order hash error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    PayHere payment notification webhook (called by PayHere servers)
// @route   POST /api/payments/notify
// @access  Public (no JWT — PayHere server sends this, not the browser)
// NOTE:    PayHere sends data as application/x-www-form-urlencoded (not JSON)
// ─────────────────────────────────────────────────────────────────────────────
const payhereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = req.body;

    console.log('🔔 PayHere Notify received:', { order_id, status_code, payment_id });

    // 1. Verify signature — ensures request genuinely came from PayHere
    // md5sig = UPPER(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UPPER(MD5(merchant_secret))))
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const hashedSecret   = md5(merchantSecret).toUpperCase();
    const expectedSig    = md5(
      `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`
    ).toUpperCase();

    if (expectedSig !== (md5sig || '').toUpperCase()) {
      console.error('❌ PayHere signature mismatch');
      return res.status(400).send('Invalid signature');
    }

    // 2. Find which entity this payment belongs to (Booking or Order) by payhereOrderId
    const isBookingPayment = order_id.startsWith('BK-PAY-');
    const isOrderPayment   = order_id.startsWith('ORD-PAY-');

    if (isBookingPayment) {
      // ── Handle Booking payment ──────────────────────────────────────────
      const booking = await Booking.findOne({ payhereOrderId: order_id });
      if (!booking) {
        console.error('❌ No booking found for order_id:', order_id);
        return res.status(404).send('Booking not found');
      }
      if (String(status_code) === '2') {
        booking.paymentStatus = 'paid';
        booking.paymentId     = payment_id;
        if (booking.status === 'pending') booking.status = 'confirmed';
        console.log(`✅ Booking payment success: ${booking._id}`);
      } else if (['-1', '-2', '-3'].includes(String(status_code))) {
        booking.paymentStatus = 'failed';
        console.log(`❌ Booking payment failed (${status_code}): ${booking._id}`);
      }
      await booking.save();

    } else if (isOrderPayment) {
      // ── Handle Order (product) payment ─────────────────────────────────
      const order = await Order.findOne({ payhereOrderId: order_id });
      if (!order) {
        console.error('❌ No order found for order_id:', order_id);
        return res.status(404).send('Order not found');
      }
      if (String(status_code) === '2') {
        order.paymentStatus = 'completed';
        order.paymentId     = payment_id;
        if (order.orderStatus === 'pending') order.orderStatus = 'confirmed';
        console.log(`✅ Order payment success: ${order._id}`);
      } else if (['-1', '-2', '-3'].includes(String(status_code))) {
        order.paymentStatus = 'failed';
        console.log(`❌ Order payment failed (${status_code}): ${order._id}`);
      }
      await order.save();
    } else {
      console.error('❌ Unknown order_id prefix:', order_id);
    }

    // PayHere expects HTTP 200 to confirm webhook receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notify error:', error);
    res.status(500).send('Server error');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Optimistic confirm from popup callback (before webhook arrives)
// @route   POST /api/payments/confirm
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const confirmPayment = async (req, res) => {
  try {
    const { orderId, paymentId, type } = req.body; // type: 'booking' | 'order'

    if (type === 'order') {
      const order = await Order.findOne({ payhereOrderId: orderId });
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (order.user.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Not authorised' });
      if (order.paymentStatus !== 'completed') {
        order.paymentStatus = 'completed';
        order.paymentId     = paymentId || 'popup-confirmed';
        if (order.orderStatus === 'pending') order.orderStatus = 'confirmed';
        await order.save();
      }
      return res.json({ message: 'Order payment confirmed', order });
    }

    // Default: booking
    const booking = await Booking.findOne({ payhereOrderId: orderId });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorised' });
    if (booking.paymentStatus !== 'paid') {
      booking.paymentStatus = 'paid';
      booking.paymentId     = paymentId || 'popup-confirmed';
      await booking.save();
    }
    return res.json({ message: 'Booking payment confirmed', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generatePaymentHash, generateOrderPaymentHash, payhereNotify, confirmPayment };
