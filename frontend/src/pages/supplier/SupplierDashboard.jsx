import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiBox, FiTrendingUp, FiUser } from 'react-icons/fi';
import MyProducts from './MyProducts';
import SupplierOrders from './SupplierOrders';
import SupplierProfile from './SupplierProfile';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('products');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id: 'products', label: 'My Products', icon: FiBox },
    { id: 'orders', label: 'Orders', icon: FiTrendingUp },
    { id: 'profile', label: 'Profile', icon: FiUser },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <MyProducts />;
      case 'orders':
        return <SupplierOrders />;
      case 'profile':
        return <SupplierProfile />;
      default:
        return <MyProducts />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-dark-800 border-r border-gray-700 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-white text-xl font-bold">{user?.businessName || 'Supplier'}</h2>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>

        <nav className="space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors border-l-4 ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-400 border-primary-500'
                    : 'text-gray-400 border-transparent hover:bg-dark-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default SupplierDashboard;
