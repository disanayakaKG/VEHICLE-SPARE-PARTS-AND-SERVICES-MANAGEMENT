import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '',
    contactName: '', contactPhone: '', contactEmail: '', productCategories: [], vehicleBrands: '',
    paymentTerms: 'net_30', minOrderAmount: '', leadTimeDays: '7', autoReorderEnabled: false
  });

  const categories = ['Engine Parts', 'Brake System', 'Electrical', 'Suspension', 'Body Parts', 'Interior', 'Exterior', 'Transmission', 'Cooling System', 'Fuel System', 'Other'];
  const paymentOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_60', label: 'Net 60' }
  ];

  useEffect(() => {
    fetchSuppliers();
    fetchPendingSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/approved');
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/pending');
      setPendingSuppliers(response.data);
    } catch (error) {
      console.error('Error fetching pending suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name, email: formData.email, phone: formData.phone,
        address: { street: formData.street, city: formData.city, state: formData.state, zipCode: formData.zipCode, country: formData.country },
        contactPerson: { name: formData.contactName, phone: formData.contactPhone, email: formData.contactEmail },
        productCategories: formData.productCategories,
        vehicleBrands: formData.vehicleBrands.split(',').map(s => s.trim()).filter(Boolean),
        paymentTerms: formData.paymentTerms,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        leadTimeDays: Number(formData.leadTimeDays),
        autoReorderEnabled: formData.autoReorderEnabled
      };

      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier._id}`, data);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', data);
        toast.success('Supplier created');
      }
      setShowModal(false);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name, email: supplier.email, phone: supplier.phone,
      street: supplier.address?.street || '', city: supplier.address?.city || '',
      state: supplier.address?.state || '', zipCode: supplier.address?.zipCode || '',
      country: supplier.address?.country || '',
      contactName: supplier.contactPerson?.name || '',
      contactPhone: supplier.contactPerson?.phone || '',
      contactEmail: supplier.contactPerson?.email || '',
      productCategories: supplier.productCategories || [],
      vehicleBrands: supplier.vehicleBrands?.join(', ') || '',
      paymentTerms: supplier.paymentTerms || 'net_30',
      minOrderAmount: supplier.minOrderAmount || '',
      leadTimeDays: supplier.leadTimeDays || '7',
      autoReorderEnabled: supplier.autoReorderEnabled || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (error) {
      toast.error('Error deleting supplier');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/suppliers/${id}/approve`);
      toast.success('Supplier approved');
      fetchPendingSuppliers();
    } catch (error) {
      toast.error('Failed to approve supplier');
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '', email: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '',
      contactName: '', contactPhone: '', contactEmail: '', productCategories: [], vehicleBrands: '',
      paymentTerms: 'net_30', minOrderAmount: '', leadTimeDays: '7', autoReorderEnabled: false
    });
  };

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(cat)
        ? prev.productCategories.filter(c => c !== cat)
        : [...prev.productCategories, cat]
    }));
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Suppliers</h1>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary inline-flex items-center">
            <FiPlus className="mr-2" /> Add Supplier
          </button>
        </div>

        {pendingSuppliers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-800 mb-3">
              Pending Approvals ({pendingSuppliers.length})
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {pendingSuppliers.map(s => (
                <div key={s._id}
                  className="flex items-center justify-between px-4 py-3 
                             border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {s.businessName || s.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {s.email} · {s.productCategory}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(s._id)}
                    className="text-xs px-3 py-1.5 bg-green-600 
                               text-white rounded hover:bg-green-700">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier) => (
              <div key={supplier._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 hover:border-primary-500/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{supplier.name}</h3>
                    <p className="text-sm text-dark-400">{supplier.email}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(supplier)} className="text-blue-400 hover:text-blue-300 transition-colors"><FiEdit /></button>
                    <button onClick={() => handleDelete(supplier._id)} className="text-red-400 hover:text-red-300 transition-colors"><FiTrash2 /></button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-dark-400">Phone:</span> <span className="text-dark-200">{supplier.phone}</span></p>
                  <p><span className="text-dark-400">Payment:</span> <span className="text-dark-200">{supplier.paymentTerms?.replace('_', ' ')}</span></p>
                  <p><span className="text-dark-400">Lead Time:</span> <span className="text-dark-200">{supplier.leadTimeDays} days</span></p>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {supplier.productCategories?.slice(0, 3).map(cat => (
                    <span key={cat} className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded border border-dark-600/50">{cat}</span>
                  ))}
                  {supplier.productCategories?.length > 3 && (
                    <span className="text-xs text-dark-400">+{supplier.productCategories.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-dark-300 mb-1">Company Name</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Phone</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input-field" required />
                    </div>
                  </div>

                  <div className="border-t border-dark-700/50 pt-4">
                    <h3 className="font-medium text-white mb-3">Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="input-field" placeholder="Street" />
                      </div>
                      <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="input-field" placeholder="City" />
                      <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="input-field" placeholder="State" />
                      <input type="text" value={formData.zipCode} onChange={(e) => setFormData({...formData, zipCode: e.target.value})} className="input-field" placeholder="Zip Code" />
                      <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="input-field" placeholder="Country" />
                    </div>
                  </div>

                  <div className="border-t border-dark-700/50 pt-4">
                    <h3 className="font-medium text-white mb-3">Contact Person</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <input type="text" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className="input-field" placeholder="Name" />
                      <input type="text" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} className="input-field" placeholder="Phone" />
                      <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="input-field" placeholder="Email" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Product Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${formData.productCategories.includes(cat) ? 'bg-primary-600 text-white' : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:bg-dark-700'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Vehicle Brands (comma separated)</label>
                    <input type="text" value={formData.vehicleBrands} onChange={(e) => setFormData({...formData, vehicleBrands: e.target.value})} className="input-field" placeholder="Toyota, Honda, etc." />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Payment Terms</label>
                      <select value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} className="input-field">
                        {paymentOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Min Order (Rs.)</label>
                      <input type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Lead Time (days)</label>
                      <input type="number" value={formData.leadTimeDays} onChange={(e) => setFormData({...formData, leadTimeDays: e.target.value})} className="input-field" />
                    </div>
                  </div>

                  <label className="flex items-center text-dark-300">
                    <input type="checkbox" checked={formData.autoReorderEnabled} onChange={(e) => setFormData({...formData, autoReorderEnabled: e.target.checked})} className="mr-2 rounded bg-dark-700 border-dark-600" />
                    <span className="text-sm">Enable auto-reorder when stock is low</span>
                  </label>

                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSuppliers;
