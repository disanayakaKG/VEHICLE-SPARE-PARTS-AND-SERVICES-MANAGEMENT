import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiStar, FiCreditCard } from 'react-icons/fi';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [payingBookingId, setPayingBookingId] = useState(null); // tracks which booking is being paid

  // 2.automatically watches the 'filter' variable. 
  // Every time the user changes the dropdown, this re-runs fetchBookings().
  useEffect(() => {
    fetchBookings();
  }, [filter]);

  // 3. The function that asks the backend for data
  const fetchBookings = async () => {
    try {
      // status=pending part in the Dropdown
      const params = filter ? { status: filter } : {};
      const response = await api.get('/bookings/mybookings', { params });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`, { reason: 'Customer requested cancellation' });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };


  const openReviewModal = (booking) => {
    setReviewBooking(booking);
    setReviewForm({ rating: 5, title: '', comment: '' });
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        service: reviewBooking.service?._id || reviewBooking.service,
        booking: reviewBooking._id,
        rating: Number(reviewForm.rating),
        title: reviewForm.title || undefined,
        comment: reviewForm.comment
      });
      toast.success('Feedback submitted! Awaiting admin approval.');
      setShowReviewModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    }
  };
  //dropdown box colors add this part
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
      case 'confirmed': return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
      case 'in_progress': return 'bg-purple-900/30 text-purple-400 border border-purple-700/50';
      case 'completed': return 'bg-green-900/30 text-green-400 border border-green-700/50';
      case 'cancelled': return 'bg-red-900/30 text-red-400 border border-red-700/50';
      case 'rejected': return 'bg-red-900/30 text-red-400 border border-red-700/50';
      default: return 'bg-dark-700/40 text-dark-300';
    }
  };

  // Payment status badge styling
  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':   return { cls: 'bg-green-900/30 text-green-400 border border-green-700/50', label: '✅ Paid' };
      case 'failed': return { cls: 'bg-red-900/30   text-red-400   border border-red-700/50',   label: '❌ Failed' };
      default:       return { cls: 'bg-orange-900/30 text-orange-400 border border-orange-700/50', label: '⚠️ Unpaid' };
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Bookings</h1>
          {/* Dropdown Box: This allows the user to filter their bookings based on the status. */}
          {/* When the user selects an option, the 'filter' varable. */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-48"
          >
            <option value="">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50">
            <FiCalendar className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg text-white">{booking.service?.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-dark-400 text-sm">Booking #: {booking.bookingNumber}</p>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <p className="font-bold text-xl text-primary-400">Rs. {booking.totalPrice?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-dark-700/50">
                  <div>
                    <p className="text-sm text-dark-400">Date & Time</p>
                    <p className="font-medium text-white">
                      {new Date(booking.scheduledDate || booking.requestedDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-primary-400 font-medium">
                      {booking.scheduledTime || booking.requestedTime || 'Pending admin assignment'}
                    </p>
                    {!booking.scheduledTime && (
                      <p className="text-xs text-dark-500 mt-1">Requested slot (not confirmed yet)</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-dark-400">Vehicle</p>
                    <p className="font-medium text-white">
                      {booking.vehicleInfo?.brand} {booking.vehicleInfo?.model} ({booking.vehicleInfo?.year || 'N/A'})
                    </p>
                    <p className="text-dark-400">{booking.vehicleInfo?.plateNumber}</p>
                  </div>
                  {booking.assignedTechnician && (
                    <div>
                      <p className="text-sm text-dark-400">Technician</p>
                      <p className="font-medium text-white">{booking.assignedTechnician}</p>
                    </div>
                  )}
                </div>

                {booking.notes && (
                  <div className="mt-4 pt-4 border-t border-dark-700/50">
                    <p className="text-sm text-dark-400">Notes</p>
                    <p className="text-dark-300">{booking.notes}</p>
                  </div>
                )}

                {booking.adminNotes && (
                  <div className="mt-4 bg-blue-900/20 border border-blue-700/30 p-3 rounded-xl">
                    <p className="text-sm font-medium text-blue-400">Admin Notes</p>
                    <p className="text-blue-300 text-sm">{booking.adminNotes}</p>
                  </div>
                )}


                {['pending', 'confirmed'].includes(booking.status) && (
                  <div className="mt-4 pt-4 border-t border-dark-700/50">
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}

                {booking.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center justify-between">
                    <span className="text-sm text-dark-400">How was the service?</span>
                    <button
                      onClick={() => openReviewModal(booking)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <FiStar className="text-yellow-400" />
                      Leave Feedback
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showReviewModal && reviewBooking && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-lg w-full backdrop-blur-xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Service Feedback</h2>
                  <p className="text-dark-400">{reviewBooking.service?.name}</p>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="btn-secondary px-3 py-2">Close</button>
              </div>

              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                    className="input-field"
                    required
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Title (optional)</label>
                  <input
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Great service"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="input-field"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
