import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiPlus, FiMinus, FiPackage, FiTruck, FiCheck, FiX, FiClock, FiTrash2, FiBell, FiTrash } from 'react-icons/fi';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [report, setReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updateForm, setUpdateForm] = useState({ type: 'addition', quantity: '', reason: '' });
  const [createInventoryForm, setCreateInventoryForm] = useState({
    product: '',
    currentStock: '',
    minStockLevel: 10
  });
  
  // Stock Request States
  const [activeTab, setActiveTab] = useState('inventory');
  const [stockRequests, setStockRequests] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    productId: '',
    supplierId: '',
    requestedQuantity: '',
    priority: 'normal',
    unitCost: '',
    notes: ''
  });
  const [receiveForm, setReceiveForm] = useState({ receivedQuantity: '', notes: '' });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, alertRes, reportRes, requestRes, supplierRes, productRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/alerts'),
        api.get('/inventory/report'),
        api.get('/inventory/stock-requests'),
        api.get('/suppliers/approved'),
        api.get('/products')
      ]);
      setInventory(invRes.data.inventory);
      setAlerts(alertRes.data);
      setReport(reportRes.data);
      setStockRequests(requestRes.data.requests || []);
      setSuppliers(supplierRes.data || []);
      setProducts(productRes.data.products || productRes.data || []);
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success('Message deleted');
      fetchNotifications();
    } catch (error) {
      toast.error('Error deleting message');
    }
  };

  const handleUpdateStock = async () => {
    try {
      await api.put(`/inventory/${selectedItem._id}/stock`, {
        type: updateForm.type,
        quantity: Number(updateForm.quantity),
        reason: updateForm.reason
      });
      toast.success('Stock updated');
      setShowUpdateModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error updating stock');
    }
  };

  const handleCreateInventory = async () => {
    try {
      await api.post('/inventory', {
        product: createInventoryForm.product,
        currentStock: Number(createInventoryForm.currentStock),
        minStockLevel: Number(createInventoryForm.minStockLevel)
      });
      toast.success('Inventory item created');
      setShowCreateInventoryModal(false);
      setCreateInventoryForm({ product: '', currentStock: '', minStockLevel: 10 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating inventory item');
    }
  };

  const handleDeleteInventory = async (item) => {
    if (!window.confirm(`Delete inventory entry for "${item.product?.name}"?`)) return;
    try {
      await api.delete(`/inventory/${item._id}`);
      toast.success('Inventory item deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting inventory item');
    }
  };

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateForm({ type: 'addition', quantity: '', reason: '' });
    setShowUpdateModal(true);
  };

  // Stock Request Functions
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    console.log('Submit handler called'); // Temporary debug log
    try {
      await api.post('/inventory/stock-requests', {
        productId: requestForm.productId,
        supplierId: requestForm.supplierId,
        requestedQuantity: Number(requestForm.requestedQuantity),
        priority: requestForm.priority,
        unitCost: requestForm.unitCost ? Number(requestForm.unitCost) : 0,
        notes: requestForm.notes
      });
      toast.success('Stock request created');
      setShowRequestModal(false);
      setRequestForm({ productId: '', supplierId: '', requestedQuantity: '', priority: 'normal', unitCost: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating request');
    }
  };

  const handleUpdateRequestStatus = async (requestId, status) => {
    try {
      await api.put(`/inventory/stock-requests/${requestId}/status`, { status });
      toast.success(`Request ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Error updating request');
    }
  };

  const openReceiveModal = (request) => {
    setSelectedRequest(request);
    setReceiveForm({ receivedQuantity: request.requestedQuantity, notes: '' });
    setShowReceiveModal(true);
  };

  const handleReceiveStock = async () => {
    try {
      await api.put(`/inventory/stock-requests/${selectedRequest._id}/receive`, {
        receivedQuantity: Number(receiveForm.receivedQuantity),
        notes: receiveForm.notes
      });
      toast.success('Stock received and inventory updated');
      setShowReceiveModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error receiving stock');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50',
      approved: 'bg-blue-900/30 text-blue-400 border-blue-700/50',
      ordered: 'bg-purple-900/30 text-purple-400 border-purple-700/50',
      shipped: 'bg-indigo-900/30 text-indigo-400 border-indigo-700/50',
      received: 'bg-green-900/30 text-green-400 border-green-700/50',
      cancelled: 'bg-red-900/30 text-red-400 border-red-700/50'
    };
    return styles[status] || styles.pending;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-900/30 text-gray-400 border-gray-700/50',
      normal: 'bg-blue-900/30 text-blue-400 border-blue-700/50',
      high: 'bg-orange-900/30 text-orange-400 border-orange-700/50',
      urgent: 'bg-red-900/30 text-red-400 border-red-700/50'
    };
    return styles[priority] || styles.normal;
  };

  const availableProductsForInventory = products.filter(
    (product) => !inventory.some((item) => item.product?._id === product._id)
  );

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateInventoryModal(true)}
              className="btn-secondary inline-flex items-center"
            >
              <FiPlus className="mr-2" /> Add Inventory Item
            </button>
            <button 
              onClick={() => setShowRequestModal(true)}
              className="btn-primary inline-flex items-center"
            >
              <FiPackage className="mr-2" /> Request Stock
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'inventory' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-800/40 text-dark-300 hover:bg-dark-700/50'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'requests' 
                ? 'bg-primary-600 text-white' 
                : 'bg-dark-800/40 text-dark-300 hover:bg-dark-700/50'
            }`}
          >
            Stock Requests ({stockRequests.length})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4">
            <p className="text-sm text-dark-400">Total Items</p>
            <p className="text-2xl font-bold text-white">{report.totalItems}</p>
          </div>
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4">
            <p className="text-sm text-dark-400">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-400">{report.lowStockItems}</p>
          </div>
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4">
            <p className="text-sm text-dark-400">Out of Stock</p>
            <p className="text-2xl font-bold text-red-400">{report.outOfStock}</p>
          </div>
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-4">
            <p className="text-sm text-dark-400">Total Value</p>
            <p className="text-2xl font-bold text-green-400">Rs. {(report.totalValue || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Notifications Bar */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map(notif => (
              <div 
                key={notif._id} 
                className="bg-primary-900/20 border border-primary-500/30 rounded-xl p-3 flex items-center justify-between animate-fade-in backdrop-blur-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <FiBell className="text-primary-400 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-primary-100 text-sm font-medium">{notif.message}</p>
                    <p className="text-primary-400/60 text-[10px]">{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => deleteNotification(notif._id)}
                  className="p-1.5 hover:bg-red-500/20 text-dark-400 hover:text-red-400 rounded-lg transition-all"
                  title="Delete message"
                >
                  <FiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inventory Alerts */}
        <div className="space-y-4 mb-8">
          {/* Out of Stock Alerts (Red) */}
          {alerts.filter(item => item.currentStock === 0).length > 0 && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 animate-pulse">
              <div className="flex items-center mb-2">
                <FiAlertCircle className="text-red-400 mr-2" />
                <span className="font-medium text-red-400 font-bold uppercase tracking-wider text-sm">
                  Out of Stock Alerts ({alerts.filter(item => item.currentStock === 0).length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.filter(item => item.currentStock === 0).slice(0, 5).map(item => (
                  <span key={item._id} className="bg-red-900/40 text-red-200 text-sm px-3 py-1 rounded-lg border border-red-700/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {item.product?.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alerts (Yellow) */}
          {alerts.filter(item => item.currentStock > 0).length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
              <div className="flex items-center mb-2">
                <FiAlertCircle className="text-yellow-400 mr-2" />
                <span className="font-medium text-yellow-400">Low Stock Alerts ({alerts.filter(item => item.currentStock > 0).length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {alerts.filter(item => item.currentStock > 0).slice(0, 5).map(item => (
                  <span key={item._id} className="bg-yellow-900/30 text-yellow-300 text-sm px-3 py-1 rounded-lg border border-yellow-700/50">
                    {item.product?.name}: {item.currentStock} left
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : activeTab === 'inventory' ? (
          // Inventory Table
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Min Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Last Restocked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{item.product?.name}</p>
                      <p className="text-sm text-dark-400">{item.product?.partNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{item.currentStock}</td>
                    <td className="px-6 py-4 text-dark-400">{item.minStockLevel}</td>
                    <td className="px-6 py-4">
                      {item.currentStock === 0 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-900/30 text-red-400 border border-red-700/50">Out of Stock</span>
                      ) : item.isLowStock ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400 border border-green-700/50">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-400">
                      {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openUpdateModal(item)} className="btn-secondary text-sm">
                          Update Stock
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item)}
                          className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                          title="Delete Inventory Item"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Stock Requests Table
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Request #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {stockRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-dark-400">
                      No stock requests yet. Click "Request Stock" to create one.
                    </td>
                  </tr>
                ) : (
                  stockRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{request.requestNumber}</p>
                        <p className="text-xs text-dark-400">{new Date(request.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{request.product?.name}</p>
                        <p className="text-sm text-dark-400">{request.product?.partNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{request.supplier?.name}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-white">
                        {request.requestedQuantity}
                        {request.receivedQuantity > 0 && (
                          <span className="text-green-400 text-sm"> ({request.receivedQuantity} received)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border capitalize ${getPriorityBadge(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full border capitalize ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateRequestStatus(request._id, 'approved')}
                                className="p-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors"
                                title="Approve"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleUpdateRequestStatus(request._id, 'cancelled')}
                                className="p-2 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 transition-colors"
                                title="Cancel"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <button 
                              onClick={() => handleUpdateRequestStatus(request._id, 'ordered')}
                              className="p-2 bg-purple-900/30 text-purple-400 rounded-lg hover:bg-purple-900/50 transition-colors"
                              title="Mark as Ordered"
                            >
                              <FiPackage className="w-4 h-4" />
                            </button>
                          )}
                          {request.status === 'ordered' && (
                            <button 
                              onClick={() => handleUpdateRequestStatus(request._id, 'shipped')}
                              className="p-2 bg-indigo-900/30 text-indigo-400 rounded-lg hover:bg-indigo-900/50 transition-colors"
                              title="Mark as Shipped"
                            >
                              <FiTruck className="w-4 h-4" />
                            </button>
                          )}
                          {['ordered', 'shipped'].includes(request.status) && (
                            <button 
                              onClick={() => openReceiveModal(request)}
                              className="p-2 bg-green-900/30 text-green-400 rounded-lg hover:bg-green-900/50 transition-colors"
                              title="Receive Stock"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Update Stock Modal */}
        {showUpdateModal && selectedItem && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-md w-full backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Update Stock</h2>
                <p className="text-dark-300 mb-4">{selectedItem.product?.name}</p>
                <p className="text-sm text-dark-400 mb-4">Current Stock: <span className="text-white">{selectedItem.currentStock}</span></p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Type</label>
                    <div className="flex space-x-2">
                      {['addition', 'deduction', 'adjustment'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setUpdateForm({...updateForm, type})}
                          className={`px-4 py-2 text-sm rounded-lg capitalize transition-all ${updateForm.type === type ? 'bg-primary-600 text-white' : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:bg-dark-700'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">
                      {updateForm.type === 'adjustment' ? 'New Stock Level' : 'Quantity'}
                    </label>
                    <input
                      type="number"
                      value={updateForm.quantity}
                      onChange={(e) => setUpdateForm({...updateForm, quantity: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Reason</label>
                    <input
                      type="text"
                      value={updateForm.reason}
                      onChange={(e) => setUpdateForm({...updateForm, reason: e.target.value})}
                      className="input-field"
                      placeholder="e.g., New shipment received"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button onClick={() => setShowUpdateModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleUpdateStock} className="btn-primary flex-1">Update</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Inventory Modal */}
        {showCreateInventoryModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-md w-full backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Add Inventory Item</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Product</label>
                    <select
                      value={createInventoryForm.product}
                      onChange={(e) => setCreateInventoryForm({ ...createInventoryForm, product: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select product</option>
                      {availableProductsForInventory.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.partNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Current Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={createInventoryForm.currentStock}
                      onChange={(e) => setCreateInventoryForm({ ...createInventoryForm, currentStock: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Min Stock Level</label>
                    <input
                      type="number"
                      min="0"
                      value={createInventoryForm.minStockLevel}
                      onChange={(e) => setCreateInventoryForm({ ...createInventoryForm, minStockLevel: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateInventoryModal(false);
                      setCreateInventoryForm({ product: '', currentStock: '', minStockLevel: 10 });
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInventory}
                    className="btn-primary flex-1"
                    disabled={!createInventoryForm.product || createInventoryForm.currentStock === ''}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Stock Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-lg w-full backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Request Stock from Supplier</h2>
                
                <form onSubmit={handleCreateRequest}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Product *</label>
                      <select
                        value={requestForm.productId}
                        onChange={(e) => setRequestForm({...requestForm, productId: e.target.value})}
                        className="input-field"
                        required
                      >
                        <option value="">Select a product</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>
                            {product.name} ({product.partNumber})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Supplier *</label>
                      <select
                        value={requestForm.supplierId}
                        onChange={(e) => setRequestForm({...requestForm, supplierId: e.target.value})}
                        className="input-field"
                        required
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier._id} value={supplier._id}>
                            {supplier.businessName || supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Quantity *</label>
                        <input
                          type="number"
                          value={requestForm.requestedQuantity}
                          onChange={(e) => setRequestForm({...requestForm, requestedQuantity: e.target.value})}
                          className="input-field"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-1">Unit Cost (Rs.)</label>
                        <input
                          type="number"
                          value={requestForm.unitCost}
                          onChange={(e) => setRequestForm({...requestForm, unitCost: e.target.value})}
                          className="input-field"
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Priority</label>
                      <div className="flex space-x-2">
                        {['low', 'normal', 'high', 'urgent'].map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setRequestForm({...requestForm, priority: p})}
                            className={`px-4 py-2 text-sm rounded-lg capitalize transition-all ${
                              requestForm.priority === p 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:bg-dark-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Notes</label>
                      <textarea
                        value={requestForm.notes}
                        onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                        className="input-field"
                        rows="3"
                        placeholder="Additional notes for the supplier..."
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowRequestModal(false);
                        setRequestForm({ productId: '', supplierId: '', requestedQuantity: '', priority: 'normal', unitCost: '', notes: '' });
                      }} 
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="btn-primary flex-1"
                      disabled={!requestForm.productId || !requestForm.supplierId || !requestForm.requestedQuantity}
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Receive Stock Modal */}
        {showReceiveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-md w-full backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Receive Stock</h2>
                <p className="text-dark-300 mb-4">Request: {selectedRequest.requestNumber}</p>
                <p className="text-sm text-dark-400 mb-4">
                  Product: <span className="text-white">{selectedRequest.product?.name}</span>
                </p>
                <p className="text-sm text-dark-400 mb-4">
                  Requested: <span className="text-white">{selectedRequest.requestedQuantity}</span>
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Received Quantity *</label>
                    <input
                      type="number"
                      value={receiveForm.receivedQuantity}
                      onChange={(e) => setReceiveForm({...receiveForm, receivedQuantity: e.target.value})}
                      className="input-field"
                      min="1"
                      max={selectedRequest.requestedQuantity}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Notes</label>
                    <textarea
                      value={receiveForm.notes}
                      onChange={(e) => setReceiveForm({...receiveForm, notes: e.target.value})}
                      className="input-field"
                      rows="2"
                      placeholder="Any notes about the received stock..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button onClick={() => setShowReceiveModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button 
                    onClick={handleReceiveStock} 
                    className="btn-primary flex-1"
                    disabled={!receiveForm.receivedQuantity}
                  >
                    Confirm Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;
