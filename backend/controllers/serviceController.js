const Service = require('../models/Service');

const normalizeVehiclePricing = (vehiclePricing) => {
  if (!Array.isArray(vehiclePricing)) return [];
  return vehiclePricing
    .filter((row) => row && row.vehicleType)
    .map((row) => ({
      vehicleType: row.vehicleType,
      price: Number(row.price)
    }))
    .filter((row) => !Number.isNaN(row.price) && row.price >= 0);
};

// @desc    Get all services
// @route   GET /api/services
const getServices = async (req, res) => {
  try {
    const { category, vehicleType, isPackage } = req.query;
    
    let query = { isActive: true };
    if (category) query.category = category;
    if (vehicleType) query.vehicleTypes = vehicleType;
    if (isPackage !== undefined) query.isPackage = isPackage === 'true';

    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service packages
// @route   GET /api/services/packages
const getServicePackages = async (req, res) => {
  try {
    const packages = await Service.find({ isActive: true, isPackage: true });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service by ID
// @route   GET /api/services/:id
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create service (Admin)
// @route   POST /api/services
const createService = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      vehiclePricing: normalizeVehiclePricing(req.body.vehiclePricing)
    };
    const service = new Service(payload);
    const createdService = await service.save();
    res.status(201).json(createdService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service (Admin)
// @route   PUT /api/services/:id
const updateService = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      vehiclePricing: normalizeVehiclePricing(req.body.vehiclePricing)
    };
    const service = await Service.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete service (Admin)
// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (service) {
      res.json({ message: 'Service removed' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getServices, 
  getServicePackages,
  getServiceById, 
  createService, 
  updateService, 
  deleteService 
};
