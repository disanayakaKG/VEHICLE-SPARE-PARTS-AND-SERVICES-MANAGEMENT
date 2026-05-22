import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiSave } from 'react-icons/fi';
import api from '../../services/api';

const SupplierProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    productCategory: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers/my/profile');
      setFormData({
        name: response.data.name || '',
        businessName: response.data.businessName || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        productCategory: response.data.productCategory || '',
        address: {
          street: response.data.address?.street || '',
          city: response.data.address?.city || '',
          state: response.data.address?.state || '',
          zipCode: response.data.address?.zipCode || '',
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      address: { ...formData.address, [name]: value },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/suppliers/my/profile', {
        name: formData.name,
        businessName: formData.businessName,
        phone: formData.phone,
        productCategory: formData.productCategory,
        address: formData.address,
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-2">Manage your supplier profile information</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Business Info Section */}
          <div className="border-b border-gray-700 pb-6">
            <h2 className="text-xl font-bold text-white mb-6">Business Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email (Read-only)</label>
                <input
                  type="email"
                  value={formData.email}
                  className="input-field bg-dark-700 cursor-not-allowed"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Category</label>
                <input
                  type="text"
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Engine Parts, Brake System"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6">Address</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.address.city}
                    onChange={handleAddressChange}
                    className="input-field"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                    className="input-field"
                    placeholder="State"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.address.zipCode}
                  onChange={handleAddressChange}
                  className="input-field"
                  placeholder="Zip code"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-700 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <FiSave className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierProfile;
