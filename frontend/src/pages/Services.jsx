import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiClock, FiTool, FiStar } from 'react-icons/fi';

const Services = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsService, setReviewsService] = useState(null);
  const [serviceReviews, setServiceReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    vehicleType: 'Car',
    brand: '',
    model: '',
    year: '',
    plateNumber: '',
    requestedDate: '',
    requestedTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchServices();
    fetchPackages();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await api.get('/services/packages');
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const handleBookService = async (service) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const fetchAvailableSlots = async (date) => {
    if (!selectedService || !date) return;
    try {
      const response = await api.get(`/bookings/slots/${selectedService._id}/${date}`);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleDateChange = (date) => {
    setBookingForm({ ...bookingForm, requestedDate: date, requestedTime: '' });
    fetchAvailableSlots(date);
  };


  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    try {
      const bookingRes = await api.post('/bookings', {
        service: selectedService._id,
        vehicleInfo: {
          type: bookingForm.vehicleType,
          brand: bookingForm.brand,
          model: bookingForm.model,
          year: parseInt(bookingForm.year) || undefined,
          plateNumber: bookingForm.plateNumber
        },
        requestedDate: bookingForm.requestedDate,
        requestedTime: bookingForm.requestedTime,
        notes: bookingForm.notes
      });

      toast.success('Booking created successfully! 🎉');
      setShowBookingModal(false);
      navigate('/bookings');

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const openReviews = async (service) => {
    setReviewsService(service);
    setShowReviewsModal(true);
    setReviewsLoading(true);
    try {
      const response = await api.get(`/reviews/service/${service._id}`);
      setServiceReviews(response.data.reviews || []);
    } catch (error) {
      setServiceReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const vehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Van', 'SUV', 'Bus'];
  const getServicePriceForVehicle = (service, vehicleType) => {
    const specific = service?.vehiclePricing?.find((row) => row.vehicleType === vehicleType);
    return specific?.price ?? service?.price ?? 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 relative"
      style={{
        backgroundImage: "url('https://www.shutterstock.com/image-photo/car-repair-station-softfocus-over-600nw-2508953265.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-dark-400 max-w-2xl mx-auto">
            Professional vehicle maintenance and repair services by certified technicians
          </p>
        </div>

        {/* Service Packages */}
        {packages.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Service Packages</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div key={pkg._id} className={`bg-dark-800/40 backdrop-blur-xl rounded-2xl border p-6 relative ${pkg.packageType === 'premium' ? 'border-primary-500' : 'border-dark-700/50'}`}>
                  {pkg.image && (
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-36 object-cover rounded-xl mb-4 border border-dark-700/50"
                    />
                  )}
                  {pkg.packageType === 'premium' && (
                    <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs px-3 py-1 rounded-bl-lg">Popular</span>
                  )}
                  <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
                  <p className="text-dark-400 text-sm mb-4">{pkg.description}</p>
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent mb-4">
                    Rs. {pkg.price.toLocaleString()}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {pkg.includedServices?.map((service, index) => (
                      <li key={index} className="flex items-center text-sm text-dark-300">
                        <span className="text-green-400 mr-2">&#10003;</span> {service}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center text-dark-400 text-sm mb-4">
                    <FiClock className="mr-2" /> {pkg.duration} minutes
                  </div>
                  <button
                    onClick={() => handleBookService(pkg)}
                    className="btn-primary w-full"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Services */}
        <h2 className="text-2xl font-bold text-white mb-6">All Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.filter(s => !s.isPackage).map((service) => (
            <div key={service._id} className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 p-6 hover:border-primary-500/30 transition-all duration-300">
              {service.image && (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-36 object-cover rounded-xl mb-4 border border-dark-700/50"
                />
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <FiTool className="w-6 h-6 text-primary-400" />
                </div>
                <span className="bg-dark-700/50 text-dark-300 text-xs px-2 py-1 rounded border border-dark-600/50">
                  {service.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
              <p className="text-dark-400 text-sm mb-4 line-clamp-2">{service.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-dark-400 text-sm">
                  <FiClock className="mr-1" /> {service.duration} min
                </div>
                <div className="text-xl font-bold text-primary-400">
                  Rs. {service.price.toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openReviews(service)}
                className="w-full mb-3 flex items-center justify-between px-3 py-2 bg-dark-700/30 hover:bg-dark-700/40 border border-dark-600/40 rounded-xl transition-colors"
              >
                <span className="flex items-center gap-2 text-sm text-dark-200">
                  <FiStar className="text-yellow-400" />
                  Reviews
                </span>
                <span className="text-sm text-dark-400">
                  {service.totalReviews ? `${Number(service.averageRating || 0).toFixed(1)} / 5` : 'No ratings'} ({service.totalReviews || 0})
                </span>
              </button>
              <button
                onClick={() => handleBookService(service)}
                className="btn-primary w-full"
              >
                Book Service
              </button>
            </div>
          ))}
        </div>

        {/* Reviews Modal */}
        {showReviewsModal && reviewsService && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Service Reviews</h2>
                    <p className="text-dark-400">{reviewsService.name}</p>
                  </div>
                  <button onClick={() => setShowReviewsModal(false)} className="btn-secondary px-3 py-2">Close</button>
                </div>

                {reviewsLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : serviceReviews.length === 0 ? (
                  <div className="text-center py-10 text-dark-400 bg-dark-800/40 rounded-2xl border border-dark-700/50">
                    No approved reviews yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceReviews.map((r) => (
                      <div key={r._id} className="bg-dark-800/40 border border-dark-700/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{r.user?.name || 'Customer'}</p>
                          <div className="text-yellow-400 text-sm">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>
                        {r.title && <p className="text-dark-200 font-medium mt-2">{r.title}</p>}
                        <p className="text-dark-300 mt-1">{r.comment}</p>
                        <p className="text-xs text-dark-500 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && selectedService && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Book Service</h2>
                <p className="text-dark-400 mb-6">
                  {selectedService.name} - Rs. {getServicePriceForVehicle(selectedService, bookingForm.vehicleType).toLocaleString()}
                </p>

                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Vehicle Type</label>
                      <select
                        value={bookingForm.vehicleType}
                        onChange={(e) => setBookingForm({ ...bookingForm, vehicleType: e.target.value })}
                        className="input-field"
                        required // ✨ FRONTEND VALIDATION: Prevents submission if no vehicle type is selected
                      >
                        {vehicleTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <p className="text-xs text-primary-400 mt-1">
                        Price for {bookingForm.vehicleType}: Rs. {getServicePriceForVehicle(selectedService, bookingForm.vehicleType).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Brand</label>
                      <select
                        value={bookingForm.brand}
                        onChange={(e) => setBookingForm({ ...bookingForm, brand: e.target.value })}
                        className="input-field"
                        required // ✨ FRONTEND VALIDATION: Mandates the brand select field to be filled
                      >
                        <option value="" disabled>Select a brand</option>
                        <option value="Toyota">Toyota</option>
                        <option value="Honda">Honda</option>
                        <option value="Nissan">Nissan</option>
                        <option value="Mitsubishi">Mitsubishi</option>
                        <option value="Suzuki">Suzuki</option>
                        <option value="Mazda">Mazda</option>
                        <option value="Subaru">Subaru</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Model</label>
                      <input
                        type="text"
                        value={bookingForm.model}
                        onChange={(e) => setBookingForm({ ...bookingForm, model: e.target.value })}
                        className="input-field"
                        placeholder="e.g., Corolla"
                        required // ✨ FRONTEND VALIDATION: Mandates the model text field to be filled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Year</label>
                      <input
                        type="number"
                        value={bookingForm.year}
                        onChange={(e) => setBookingForm({ ...bookingForm, year: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 2020"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Plate Number</label>
                    <input
                      type="text"
                      value={bookingForm.plateNumber}
                      onChange={(e) => setBookingForm({ ...bookingForm, plateNumber: e.target.value })}
                      className="input-field"
                      placeholder="e.g., ABC-1234"
                      required // ✨ FRONTEND VALIDATION: Mandates the plate number text field to be filled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={bookingForm.requestedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]} // ✨ FRONTEND VALIDATION: User cannot select dates in the past
                      className="input-field"
                      required // ✨ FRONTEND VALIDATION: Field cannot be empty when submitted
                    />
                  </div>
                  {bookingForm.requestedDate && (
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-1">Preferred Time (Admin will confirm)</label>
                      {availableSlots.length === 0 ? (
                        <p className="text-dark-500 text-sm">No confirmed slots available list for this date</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setBookingForm({ ...bookingForm, requestedTime: slot })}
                              className={`py-2 px-3 text-sm rounded border transition-all ${bookingForm.requestedTime === slot
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'border-dark-600 text-dark-300 hover:border-primary-500 hover:text-white'
                                }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-dark-500 mt-2">
                        You are submitting a reservation request. The admin will assign the final time when approving.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1">Additional Notes</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Any specific issues or requests..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => setShowBookingModal(false)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <span>💳</span> Book Now
                    </button>
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

export default Services;
