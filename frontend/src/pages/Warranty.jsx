import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiClock, FiCheck, FiX, FiAlertCircle, FiDownload, FiChevronDown, FiChevronUp, FiTruck } from 'react-icons/fi';

const Warranty = () => {
  const [claims, setClaims] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState({});
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [downloadingCard, setDownloadingCard] = useState(null);
  const location = useLocation();
  const [claimForm, setClaimForm] = useState({
    issueDescription: '',
    issueType: 'defective'
  });
  const [claimImages, setClaimImages] = useState([]);

  useEffect(() => {
    fetchClaims();
    fetchDeliveredOrders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get('orderId');
    const productId = params.get('productId');

    if (orderId && productId && orders.length > 0) {
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setSelectedOrder(order);
        const product = order.items.find(item => (item.product?._id || item.product) === productId);
        if (product) {
          setSelectedProduct(product);
          setShowClaimForm(true);
        }
      }
    }
  }, [location.search, orders]);

  const fetchClaims = async () => {
    try {
      const response = await api.get('/warranty/myclaims');
      setClaims(response.data.claims);
    } catch (error) {
      console.error('Error fetching claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveredOrders = async () => {
    try {
      const response = await api.get('/orders/myorders', { params: { status: 'delivered' } });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();

    /* 
      Issue Type: Mandatory selection (Defective by default).
      Issue Description: Required, 10-1000 characters.
      Images: Mandatory, 1-5 files.
    */

    if (!claimImages || claimImages.length === 0) {
      toast.error('Please upload at least one image of the product/issue');
      return;
    }

    if (!claimForm.issueDescription || claimForm.issueDescription.trim().length < 10) {
      toast.error('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    if (claimForm.issueDescription.length > 1000) {
      toast.error('Description is too long (maximum 1000 characters)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('product', selectedProduct.product?._id || selectedProduct.product);
      formData.append('order', selectedOrder._id);
      formData.append('issueDescription', claimForm.issueDescription);
      formData.append('issueType', claimForm.issueType);
      claimImages.forEach((file) => formData.append('images', file));

      await api.post('/warranty', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Warranty claim submitted successfully');
      setShowClaimForm(false);
      setSelectedOrder(null);
      setSelectedProduct(null);
      setClaimForm({ issueDescription: '', issueType: 'defective' });
      setClaimImages([]);
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleDownloadInvoice = async (claimId, claimNumber) => {
    setDownloadingInvoice(claimId);
    try {
      const response = await api.get(`/warranty/${claimId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `warranty-invoice-${claimNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const handleDownloadCard = async (claimId, claimNumber) => {
    setDownloadingCard(claimId);
    try {
      const response = await api.get(`/warranty/${claimId}/card`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `warranty-card-${claimNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Warranty card downloaded');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download warranty card');
    } finally {
      setDownloadingCard(null);
    }
  };

  const toggleHistoryExpand = (claimId) => {
    setExpandedHistory(prev => ({
      ...prev,
      [claimId]: !prev[claimId]
    }));
  };

  const getWarrantyProgress = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    const percentage = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    const daysRemaining = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);
    const isExpired = now > end;
    return { percentage, daysRemaining, isExpired };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50';
      case 'under_review': return 'bg-blue-900/30 text-blue-400 border border-blue-700/50';
      case 'approved': return 'bg-green-900/30 text-green-400 border border-green-700/50';
      case 'rejected': return 'bg-red-900/30 text-red-400 border border-red-700/50';
      case 'replacement_sent': return 'bg-purple-900/30 text-purple-400 border border-purple-700/50';
      case 'completed': return 'bg-green-900/30 text-green-400 border border-green-700/50';
      default: return 'bg-dark-700/40 text-dark-300';
    }
  };

  const getReplacementStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900/30 text-yellow-400';
      case 'shipped': return 'bg-blue-900/30 text-blue-400';
      case 'delivered': return 'bg-green-900/30 text-green-400';
      case 'failed': return 'bg-red-900/30 text-red-400';
      default: return 'bg-dark-700/40 text-dark-300';
    }
  };

  const issueTypes = [
    { value: 'defective', label: 'Defective Product' },
    { value: 'damaged', label: 'Damaged on Arrival' },
    { value: 'not_working', label: 'Not Working Properly' },
    { value: 'wrong_item', label: 'Wrong Item Received' },
    { value: 'other', label: 'Other Issue' }
  ];

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
          <h1 className="text-3xl font-bold text-white">Warranty Claims</h1>
          <button onClick={() => setShowClaimForm(true)} className="btn-primary">
            New Claim
          </button>
        </div>

        {/* Existing Claims */}
        {claims.length === 0 ? (
          <div className="text-center py-12 bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50">
            <FiShield className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 text-lg">No warranty claims yet</p>
            <p className="text-dark-500 text-sm mt-2">Submit a claim for any product issues covered under warranty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const warranty = getWarrantyProgress(claim.warrantyStartDate, claim.warrantyEndDate);
              return (
                <div key={claim._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={claim.product?.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={claim.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-white">{claim.product?.name}</h3>
                        <p className="text-sm text-dark-400">Claim #: {claim.claimNumber}</p>
                        <p className="text-sm text-dark-400">Order: {claim.order?.orderNumber}</p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(claim.status)}`}>
                        {claim.status.replace('_', ' ')}
                      </span>
                      {['approved', 'replacement_sent', 'completed'].includes(claim.status) && (
                        <button
                          onClick={() => handleDownloadCard(claim._id, claim.claimNumber)}
                          disabled={downloadingCard === claim._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-600 rounded-lg text-sm transition-colors"
                        >
                          <FiDownload className={downloadingCard === claim._id ? 'animate-bounce' : ''} />
                          {downloadingCard === claim._id ? 'Downloading...' : 'Card'}
                        </button>
                      )}
                      {claim.status !== 'pending' && (
                        <button
                          onClick={() => handleDownloadInvoice(claim._id, claim.claimNumber)}
                          disabled={downloadingInvoice === claim._id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-600 rounded-lg text-sm transition-colors"
                        >
                          <FiDownload className={downloadingInvoice === claim._id ? 'animate-bounce' : ''} />
                          {downloadingInvoice === claim._id ? 'Downloading...' : 'Invoice'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Warranty Progress Bar */}
                  <div className="mb-4 p-3 bg-dark-700/30 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-dark-400">Warranty Period</span>
                      <span className={`text-sm font-medium ${warranty.isExpired ? 'text-red-400' : 'text-green-400'}`}>
                        {warranty.isExpired ? 'Expired' : `${warranty.daysRemaining} days remaining`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${warranty.isExpired ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{ width: `${warranty.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-dark-500">
                      <span>{new Date(claim.warrantyStartDate).toLocaleDateString()}</span>
                      <span>{new Date(claim.warrantyEndDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-dark-700/50">
                    <div>
                      <p className="text-sm text-dark-400">Issue Type</p>
                      <p className="font-medium text-white capitalize">{claim.issueType.replace('_', ' ')}</p>
                    </div>
                    {claim.resolvedAt && (
                      <div>
                        <p className="text-sm text-dark-400">Resolved On</p>
                        <p className="font-medium text-white">{new Date(claim.resolvedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <div className="flex items-start gap-2">
                        <FiAlertCircle className="text-dark-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-dark-400">Issue Description</p>
                          <p className="text-dark-200">{claim.issueDescription}</p>
                        </div>
                      </div>
                    </div>
                    {claim.images && claim.images.length > 0 && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-dark-400 mb-2">Uploaded Photos</p>
                        <div className="flex flex-wrap gap-2">
                          {claim.images.map((img, idx) => (
                            <a
                              key={idx}
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="block border border-dark-600/60 rounded-lg overflow-hidden"
                              title="Open image"
                            >
                              <img src={img} alt={`Claim ${claim.claimNumber} ${idx + 1}`} className="w-20 h-20 object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {claim.resolution && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-dark-400">Resolution</p>
                        <p className="font-medium capitalize text-green-400">{claim.resolution}</p>
                      </div>
                    )}
                    {claim.adminNotes && (
                      <div className="md:col-span-2 bg-blue-900/20 border border-blue-700/30 p-3 rounded-xl">
                        <p className="text-sm font-medium text-blue-400">Admin Response</p>
                        <p className="text-blue-300 text-sm">{claim.adminNotes}</p>
                      </div>
                    )}
                    {claim.replacementTrackingNumber && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-dark-400">Current Replacement Tracking</p>
                        <p className="font-medium text-white">{claim.replacementTrackingNumber}</p>
                      </div>
                    )}

                    {/* Replacement History Section */}
                    {claim.replacementHistory && claim.replacementHistory.length > 0 && (
                      <div className="md:col-span-2">
                        <button
                          onClick={() => toggleHistoryExpand(claim._id)}
                          className="flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          <FiTruck />
                          Replacement History ({claim.replacementHistory.length})
                          {expandedHistory[claim._id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>

                        {expandedHistory[claim._id] && (
                          <div className="mt-3 pl-4 border-l-2 border-dark-600 space-y-3">
                            {claim.replacementHistory.map((replacement, index) => (
                              <div key={index} className="relative">
                                <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-primary-500"></div>
                                <div className="bg-dark-700/30 p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-white">{replacement.trackingNumber || 'No tracking'}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded capitalize ${getReplacementStatusColor(replacement.status)}`}>
                                      {replacement.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-dark-400">
                                    Shipped: {replacement.shippedAt ? new Date(replacement.shippedAt).toLocaleDateString() : 'N/A'}
                                  </p>
                                  {replacement.receivedAt && (
                                    <p className="text-sm text-green-400">
                                      Received: {new Date(replacement.receivedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                  {replacement.notes && (
                                    <p className="text-sm text-dark-400 italic mt-1">{replacement.notes}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Claim Modal */}
        {showClaimForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Submit Warranty Claim</h2>

                {!selectedOrder ? (
                  <div>
                    <p className="text-dark-400 mb-4">Select an order to file a warranty claim:</p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {orders.length === 0 ? (
                        <p className="text-dark-500 text-center py-4">No delivered orders found</p>
                      ) : (
                        orders.map((order) => (
                          <button
                            key={order._id}
                            onClick={() => setSelectedOrder(order)}
                            className="w-full text-left p-4 bg-dark-800/40 border border-dark-700/50 rounded-xl hover:border-primary-500/50 transition-all"
                          >
                            <p className="font-medium text-white">{order.orderNumber}</p>
                            <p className="text-sm text-dark-400">
                              {new Date(order.createdAt).toLocaleDateString()} - {order.items.length} item(s)
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : !selectedProduct ? (
                  <div>
                    <button onClick={() => setSelectedOrder(null)} className="text-primary-400 hover:text-primary-300 text-sm mb-4 transition-colors">
                      &larr; Back to orders
                    </button>
                    <p className="text-dark-400 mb-4">Select a product from order {selectedOrder.orderNumber}:</p>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedProduct(item)}
                          className="w-full text-left p-4 bg-dark-800/40 border border-dark-700/50 rounded-xl hover:border-primary-500/50 transition-all flex items-center space-x-4"
                        >
                          <img
                            src={item.product?.images?.[0] || 'https://via.placeholder.com/60'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-sm text-dark-400">Qty: {item.quantity}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitClaim}>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-primary-400 hover:text-primary-300 text-sm mb-4 transition-colors">
                      &larr; Back to products
                    </button>

                    <div className="flex items-center space-x-4 p-4 bg-dark-800/40 border border-dark-700/50 rounded-xl mb-6">
                      <img
                        src={selectedProduct.product?.images?.[0] || 'https://via.placeholder.com/60'}
                        alt={selectedProduct.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium text-white">{selectedProduct.name}</p>
                        <p className="text-sm text-dark-400">Order: {selectedOrder.orderNumber}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Issue Type</label>
                        <select
                          value={claimForm.issueType}
                          onChange={(e) => setClaimForm({ ...claimForm, issueType: e.target.value })}
                          className="input-field"
                          required
                        >
                          {issueTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">
                          Upload Item Photos (1-5 images required) <span className="text-red-500">*</span>
                        </label>
                        {/* warranty images upload */}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const selectedFiles = Array.from(e.target.files || []);
                            if (selectedFiles.length > 5) {
                                toast.error('You can only upload up to 5 images. Only the first 5 will be kept.');
                            }
                            const files = selectedFiles.slice(0, 5);
                            setClaimImages(files);
                          }}
                          className="input-field"
                        />
                        {claimImages.length > 0 && (
                          <p className="text-xs text-dark-500 mt-1">{claimImages.length} file(s) selected</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Describe the Issue</label>
                        <textarea
                          value={claimForm.issueDescription}
                          onChange={(e) => setClaimForm({ ...claimForm, issueDescription: e.target.value })}
                          className={`input-field ${claimForm.issueDescription.length > 1000 ? 'border-red-500' : ''}`}
                          rows={4}
                          placeholder="Please provide details about the issue..."
                          required
                        />
                        <div className="flex justify-between mt-1">
                          <p className={`text-xs ${claimForm.issueDescription.length < 10 && claimForm.issueDescription.length > 0 ? 'text-orange-400' : 'text-dark-500'}`}>
                            {claimForm.issueDescription.length < 10 && claimForm.issueDescription.length > 0 ? 'Minimum 10 characters required' : ''}
                          </p>
                          <p className={`text-xs ${claimForm.issueDescription.length > 1000 ? 'text-red-500' : 'text-dark-500'}`}>
                            {claimForm.issueDescription.length}/1000
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-6">
                      <button type="button" onClick={() => setShowClaimForm(false)} className="btn-secondary flex-1">
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary flex-1">
                        Submit Claim
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warranty;
