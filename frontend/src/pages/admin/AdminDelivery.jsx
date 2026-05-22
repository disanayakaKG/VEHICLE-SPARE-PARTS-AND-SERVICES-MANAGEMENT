import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiTruck, FiCheck, FiX, FiUser, FiCreditCard, FiClock, FiSearch } from 'react-icons/fi';

const AdminDelivery = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      // Filter for delivery role
      setUsers(data.filter(u => u.role === 'delivery'));
    } catch (error) {
      toast.error('Failed to fetch delivery personnel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (userId, isApproved) => {
    try {
      await api.put(`/auth/users/${userId}/status`, { isApproved });
      toast.success(`Account ${isApproved ? 'approved' : 'rejected'}`);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.nicNumber?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiTruck className="text-primary-500" />
            Delivery Personnel Management
          </h2>
          <p className="text-gray-400">Review and manage delivery person registrations</p>
        </div>

        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search name, email, NIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-400 text-lg">No delivery personnel found</p>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <div key={u._id} className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-dark-700 flex items-center justify-center overflow-hidden border border-dark-600">
                  {u.photo ? (
                    <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{u.name}</h3>
                  <p className="text-sm text-gray-400">{u.email}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-primary-400 bg-primary-500/10 px-2 py-1 rounded-md">
                      <FiCreditCard className="w-3 h-3" />
                      NIC: {u.nicNumber || 'N/A'}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                      u.isApproved ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      <FiClock className="w-3 h-3" />
                      {u.isApproved ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!u.isApproved ? (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(u._id, true)}
                      className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => toast.error('Rejection logic could be added here (e.g. delete user)')}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiX /> Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleStatusUpdate(u._id, false)}
                    className="flex-1 md:flex-none px-4 py-2 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    Suspend Account
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDelivery;
