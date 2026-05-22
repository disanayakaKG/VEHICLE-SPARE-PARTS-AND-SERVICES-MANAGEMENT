import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', category: 'Maintenance', vehicleTypes: ['Car'],
    duration: '60', price: '', isPackage: false, packageType: 'standard',
    includedServices: '', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    maxBookingsPerDay: '10', image: '', vehiclePricing: {}
  });

  const categories = ['Maintenance', 'Repair', 'Inspection', 'Installation', 'Customization', 'Emergency'];
  const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus', 'All'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Frontend Validation: Prevent default form submission and page reload

    // Frontend Validation note: HTML5 'required' attributes are used on essential form fields.
    // This stops submission on the client side if the essential fields are empty.
    try {
      const data = {
        ...formData,
        // Validation: Convert inputs to Number ensure numeric types match backend schema requirements
        duration: Number(formData.duration),
        price: Number(formData.price),
        maxBookingsPerDay: Number(formData.maxBookingsPerDay),
        includedServices: formData.includedServices ? formData.includedServices.split(',').map(s => s.trim()) : [],
        // Validation: Filter out invalid vehicle pricing entries and ensure valid numeric prices (>= 0)
        vehiclePricing: Object.entries(formData.vehiclePricing)
          .map(([vehicleType, value]) => ({ vehicleType, price: Number(value) }))
          .filter((row) => !Number.isNaN(row.price) && row.price >= 0)
      };

      if (editingService) {
        await api.put(`/services/${editingService._id}`, data);
        toast.success('Service updated'); // Success path
      } else {
        await api.post('/services', data);
        toast.success('Service created'); // Success path
      }
      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      // Validation Error Handling: Shows the backend validation error message to the admin if validation fails
      toast.error(error.response?.data?.message || 'Error saving service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name, description: service.description, category: service.category,
      vehicleTypes: service.vehicleTypes, duration: service.duration, price: service.price,
      isPackage: service.isPackage, packageType: service.packageType || 'standard',
      includedServices: service.includedServices?.join(', ') || '',
      availableDays: service.availableDays, maxBookingsPerDay: service.maxBookingsPerDay,
      image: service.image || '',
      vehiclePricing: (service.vehiclePricing || []).reduce((acc, row) => {
        if (row?.vehicleType) acc[row.vehicleType] = row.price;
        return acc;
      }, {})
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) {
      toast.error('Error deleting service');
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setFormData({
      name: '', description: '', category: 'Maintenance', vehicleTypes: ['Car'],
      duration: '60', price: '', isPackage: false, packageType: 'standard',
      includedServices: '', availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      maxBookingsPerDay: '10', image: '', vehiclePricing: {}
    });
  };

  const toggleVehicleType = (type) => {
    setFormData(prev => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter(t => t !== type)
        : [...prev.vehicleTypes, type]
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Services</h1>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary inline-flex items-center">
            <FiPlus className="mr-2" /> Add Service
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 hover:border-primary-500/30 transition-all duration-300">
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-36 object-cover rounded-xl mb-4 border border-dark-700/50"
                  />
                )}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                    <span className="text-xs bg-dark-700/50 text-dark-300 px-2 py-1 rounded border border-dark-600/50">{service.category}</span>
                    {service.isPackage && (
                      <span className="text-xs bg-primary-900/30 text-primary-400 px-2 py-1 rounded border border-primary-700/50 ml-2">{service.packageType}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(service)} className="text-blue-400 hover:text-blue-300 transition-colors"><FiEdit /></button>
                    <button onClick={() => handleDelete(service._id)} className="text-red-400 hover:text-red-300 transition-colors"><FiTrash2 /></button>
                  </div>
                </div>
                <p className="text-dark-400 text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-dark-400 text-sm">{service.duration} min</span>
                  <span className="font-bold text-primary-400">Rs. {service.price.toLocaleString()}</span>
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
                <h2 className="text-2xl font-bold text-white mb-6">{editingService ? 'Edit Service' : 'Add Service'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" rows={3} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Image URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="input-field"
                      placeholder="https://example.com/service-image.jpg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input-field">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Duration (minutes)</label>
                      <input type="number" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Price (Rs.)</label>
                      <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Max Bookings/Day</label>
                      <input type="number" value={formData.maxBookingsPerDay} onChange={(e) => setFormData({...formData, maxBookingsPerDay: e.target.value})} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Vehicle Types</label>
                    <div className="flex flex-wrap gap-2">
                      {vehicleTypes.map(type => (
                        <button key={type} type="button" onClick={() => toggleVehicleType(type)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${formData.vehicleTypes.includes(type) ? 'bg-primary-600 text-white' : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:bg-dark-700'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Vehicle-wise Prices (optional)</label>
                    <p className="text-xs text-dark-500 mb-2">If a vehicle price is set, booking uses it instead of base price.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleTypes
                        .filter((type) => type !== 'All' && formData.vehicleTypes.includes(type))
                        .map((type) => (
                          <div key={type}>
                            <label className="block text-xs text-dark-400 mb-1">{type}</label>
                            <input
                              type="number"
                              min="0"
                              value={formData.vehiclePricing[type] ?? ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  vehiclePricing: {
                                    ...prev.vehiclePricing,
                                    [type]: e.target.value
                                  }
                                }))
                              }
                              className="input-field"
                              placeholder={`Default: ${formData.price || 0}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Available Days</label>
                    <div className="flex flex-wrap gap-2">
                      {days.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`px-3 py-1 text-sm rounded-lg transition-all ${formData.availableDays.includes(day) ? 'bg-primary-600 text-white' : 'bg-dark-700/50 text-dark-300 border border-dark-600 hover:bg-dark-700'}`}>
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center text-dark-300">
                      <input type="checkbox" checked={formData.isPackage} onChange={(e) => setFormData({...formData, isPackage: e.target.checked})} className="mr-2 rounded bg-dark-700 border-dark-600" />
                      <span className="text-sm">Is Package</span>
                    </label>
                    {formData.isPackage && (
                      <select value={formData.packageType} onChange={(e) => setFormData({...formData, packageType: e.target.value})} className="input-field w-40">
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="special">Special</option>
                      </select>
                    )}
                  </div>
                  {formData.isPackage && (
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Included Services (comma separated)</label>
                      <input type="text" value={formData.includedServices} onChange={(e) => setFormData({...formData, includedServices: e.target.value})} className="input-field" placeholder="Oil change, Filter replacement, etc." />
                    </div>
                  )}
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

export default AdminServices;
