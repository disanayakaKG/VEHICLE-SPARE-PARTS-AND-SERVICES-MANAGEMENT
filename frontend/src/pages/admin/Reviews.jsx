import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX } from 'react-icons/fi';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('false');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
    try {
      const response = await api.get('/reviews', { params: { isApproved: filter } });
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, isApproved, adminResponse = '') => {
    try {
      await api.put(`/reviews/${id}/moderate`, { isApproved, adminResponse: adminResponse || undefined });
      toast.success(isApproved ? 'Review approved' : 'Review rejected');
      fetchReviews();
    } catch (error) {
      toast.error('Error moderating review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Error deleting review');
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Reviews</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-48">
            <option value="false">Pending Approval</option>
            <option value="true">Approved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-dark-400 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50">No reviews found</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={review.product?.images?.[0] || 'https://via.placeholder.com/60'} 
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-medium text-white">{review.product?.name || review.service?.name}</h3>
                      <p className="text-sm text-dark-400">By {review.user?.name} - {review.user?.email}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex text-yellow-400 text-sm">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>
                        <span className="text-xs text-dark-400 ml-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs bg-green-900/30 text-green-400 border border-green-700/50 px-2 py-0.5 rounded ml-2">Verified</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!review.isApproved && (
                      <>
                        <button
                          onClick={() => handleModerate(review._id, true)}
                          className="p-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors border border-green-700/50"
                          title="Approve"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => handleModerate(review._id, false)}
                          className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors border border-red-700/50"
                          title="Reject"
                        >
                          <FiX />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  {review.title && <p className="font-medium text-white">{review.title}</p>}
                  <p className="text-dark-300 mt-1">{review.comment}</p>
                </div>

                {review.adminResponse && (
                  <div className="mt-4 bg-blue-900/20 border border-blue-700/30 p-3 rounded-xl">
                    <p className="text-sm font-medium text-blue-400">Your Response</p>
                    <p className="text-sm text-blue-300">{review.adminResponse.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
