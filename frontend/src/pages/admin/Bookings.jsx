import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: '',
    assignedTechnician: '',
    scheduledDate: '',
    scheduledTime: ''
  });

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await api.get('/bookings', { params });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await api.put(`/bookings/${selectedBooking._id}/status`, updateForm);
      toast.success('Booking updated');
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating booking');
    }
  };

  const fetchAvailableSlots = async (serviceId, date) => {
    if (!serviceId || !date) return;
    try {
      const response = await api.get(`/bookings/slots/${serviceId}/${date}`);
      setAvailableSlots(response.data);
    } catch (error) {
      setAvailableSlots([]);
    }
  };

  const openUpdateModal = (booking) => {
    setSelectedBooking(booking);
    setUpdateForm({
      status: booking.status,
      adminNotes: booking.adminNotes || '',
      assignedTechnician: booking.assignedTechnician || '',
      scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] : '',
      scheduledTime: booking.scheduledTime || ''
    });
    const initialDate = booking.scheduledDate
      ? new Date(booking.scheduledDate).toISOString().split('T')[0]
      : (booking.requestedDate ? new Date(booking.requestedDate).toISOString().split('T')[0] : '');
    if (booking.service?._id && initialDate) {
      fetchAvailableSlots(booking.service._id, initialDate);
    } else {
      setAvailableSlots([]);
    }
  };

  const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'];
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50',
      confirmed: 'bg-blue-900/30 text-blue-400 border border-blue-700/50',
      in_progress: 'bg-purple-900/30 text-purple-400 border border-purple-700/50',
      completed: 'bg-green-900/30 text-green-400 border border-green-700/50',
      cancelled: 'bg-red-900/30 text-red-400 border border-red-700/50',
      rejected: 'bg-red-900/30 text-red-400 border border-red-700/50',
    };
    return colors[status] || 'bg-dark-700/40 text-dark-300';
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Bookings</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-48">
            <option value="">All Bookings</option>
            {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Booking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{booking.bookingNumber}</td>
                    <td className="px-6 py-4">
                      <p className="text-white">{booking.user?.name}</p>
                      <p className="text-sm text-dark-400">{booking.user?.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-dark-300">{booking.service?.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-white">{booking.vehicleInfo?.brand} {booking.vehicleInfo?.model}</p>
                      <p className="text-dark-400">{booking.vehicleInfo?.plateNumber}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-white">{new Date(booking.scheduledDate || booking.requestedDate).toLocaleDateString()}</p>
                      <p className="text-primary-400 font-medium">{booking.scheduledTime || booking.requestedTime || 'Pending'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openUpdateModal(booking)} className="text-primary-400 hover:text-primary-300 transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Update Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-lg w-full backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Update Booking</h2>
                <p className="text-dark-400 mb-4">{selectedBooking.bookingNumber}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Status</label>
                    <select
                      value={updateForm.status}
                      onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                      className="input-field"
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>

                  {(updateForm.status === 'confirmed' || updateForm.status === 'in_progress') && (
                    <div className="bg-dark-800/40 border border-dark-700/50 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-dark-300">Assign Time Slot</p>
                        <p className="text-xs text-dark-500">
                          Requested: {selectedBooking.requestedTime || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-dark-400 mb-1">Date</label>
                        <input
                          type="date"
                          value={updateForm.scheduledDate}
                          onChange={(e) => {
                            const d = e.target.value;
                            setUpdateForm({ ...updateForm, scheduledDate: d, scheduledTime: '' });
                            fetchAvailableSlots(selectedBooking.service?._id, d);
                          }}
                          className="input-field"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      {updateForm.scheduledDate && (
                        <div>
                          <label className="block text-xs font-medium text-dark-400 mb-1">Available Slots</label>
                          {availableSlots.length === 0 ? (
                            <p className="text-red-400 text-sm">No slots available for this date</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setUpdateForm({ ...updateForm, scheduledTime: slot })}
                                  className={`py-2 px-3 text-sm rounded border transition-all ${updateForm.scheduledTime === slot
                                      ? 'bg-primary-600 text-white border-primary-600'
                                      : 'border-dark-600 text-dark-300 hover:border-primary-500 hover:text-white'
                                    }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Assigned Technician</label>
                    <input
                      type="text"
                      value={updateForm.assignedTechnician}
                      onChange={(e) => setUpdateForm({ ...updateForm, assignedTechnician: e.target.value })}
                      className="input-field"
                      placeholder="Technician name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Admin Notes</label>
                    <textarea
                      value={updateForm.adminNotes}
                      onChange={(e) => setUpdateForm({ ...updateForm, adminNotes: e.target.value })}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button onClick={() => setSelectedBooking(null)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={handleUpdateStatus} className="btn-primary flex-1">Update</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
