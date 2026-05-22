import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiPhone, FiZap } from 'react-icons/fi';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'customer',
    businessName: '',
    productCategory: '',
    nicNumber: '',
    photo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.role === 'supplier' && !formData.businessName) {
      toast.error('Business name is required for suppliers');
      return;
    }

    if (formData.role === 'supplier' && !formData.productCategory) {
      toast.error('Product category is required for suppliers');
      return;
    }

    setLoading(true);
    try {
      const registerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      };

      if (formData.role === 'supplier') {
        registerData.businessName = formData.businessName;
        registerData.productCategory = formData.productCategory;
      }

      if (formData.role === 'delivery') {
        registerData.nicNumber = formData.nicNumber;
        registerData.photo = formData.photo;
      }

      const result = await register(registerData);
      
      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success('Account created successfully!');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/25">
            <FiZap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Join us and start shopping</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field pl-12"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-12"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field pl-12"
                  placeholder="+94 77 123 4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">I am a:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    formData.role === 'customer'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-700 text-gray-400 border border-dark-600 hover:bg-dark-600'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'supplier' })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    formData.role === 'supplier'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-700 text-gray-400 border border-dark-600 hover:bg-dark-600'
                  }`}
                >
                  Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'delivery' })}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                    formData.role === 'delivery'
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-dark-700 text-gray-400 border border-dark-600 hover:bg-dark-600'
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
            {formData.role === 'supplier' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="input-field"
                    placeholder="Your business name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Product Category</label>
                  <select
                    value={formData.productCategory}
                    onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Engine Parts">Engine Parts</option>
                    <option value="Brake System">Brake System</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Suspension">Suspension</option>
                    <option value="Body Parts">Body Parts</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    📝 Your supplier account will be reviewed by our admin team. You'll receive an email once approved.
                  </p>
                </div>
              </>
            )}
            {formData.role === 'delivery' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">NIC Number</label>
                  <input
                    type="text"
                    value={formData.nicNumber}
                    onChange={(e) => setFormData({ ...formData, nicNumber: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 199912345678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Photo URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="input-field"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    🚚 Your delivery person account (including NIC) will be reviewed by our admin team for verification.
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-12"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field pl-12"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
