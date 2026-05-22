import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiClock } from 'react-icons/fi';
import ProductManagementSidebar from '../../components/ProductManagementSidebar';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    vehicleType: '',
    brand: '',
    vehicleBrand: '',
    vehicleModel: '',
    yearFrom: '',
    yearTo: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'default'
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, productId: null });
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 12;

  const [formData, setFormData] = useState({
    itemId: '',
    name: '',
    brand: '',
    category: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    warrantyPeriod: '',
    stockQuantity: '',
    yearFrom: '',
    yearTo: '',
    alternativeNames: ''
  });

  const [inputModes, setInputModes] = useState({
    brand: 'dropdown',
    category: 'dropdown',
    vehicleType: 'dropdown',
    vehicleBrand: 'dropdown',
    vehicleModel: 'dropdown',
    warrantyPeriod: 'dropdown'
  });

  const productNames = [
    'Batteries', 'Brake Parts', 'Filters', 'Engine Oil', 'Lights', 'Tyres', 'Suspension', 'Cooling System', 'Electrical Parts', 'Body Parts'
  ];

  const vehicleTypes = ['Car', 'Van', 'Bike', 'SUV', 'Lorry', 'Bus', 'Pickup', 'Three Wheeler', 'Tractor', 'Electric Vehicle'];
  
  const productBrands = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 'Mitsubishi', 'Bosch', 'Denso', 'Mobil', 'Amaron'];
  
  const productCategories = ['Batteries', 'Brake Parts', 'Filters', 'Oil', 'Lights', 'Tyres', 'Suspension', 'Cooling System', 'Electrical Parts', 'Engine Parts', 'Body Parts'];

  const brands = ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Audi'];

  const vehicleModelDropdownOptions = [
    'Corolla', 'Prius', 'Aqua', 'Vitz', 'Fit', 'Civic', 'Insight', 'Demio', 'CX-5', 'CX-50', 'X-Trail', 'March', 'Alto', 'Wagon R', 'Hilux'
  ];

  const warrantyOptions = [0, 1, 3, 6, 9, 12, 18, 24];

  const yearOptions = Array.from({ length: 51 }, (_, i) => 1990 + i);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/admin/all', { params: { search, limit: 5000 } });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const alternativeNamesMatch = Array.isArray(product.alternativeNames)
      ? product.alternativeNames.some((name) => String(name).toLowerCase().includes(term))
      : String(product.alternativeNames || '').toLowerCase().includes(term);
    const priceValue = Number(product.price);
    const yearFromValue = Number(product.yearFrom);
    const yearToValue = Number(product.yearTo);

    return (
      (!term ||
        product.name?.toLowerCase().includes(term) ||
        product.productId?.toLowerCase().includes(term) ||
        alternativeNamesMatch ||
        product.oemNumber?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.brand?.toLowerCase().includes(term)) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.vehicleType || product.vehicleType === filters.vehicleType) &&
      (!filters.brand || product.brand === filters.brand) &&
      (!filters.vehicleBrand || product.vehicleBrand === filters.vehicleBrand) &&
      (!filters.vehicleModel || product.vehicleModel === filters.vehicleModel) &&
      (!filters.yearFrom || (Number.isFinite(yearFromValue) && yearFromValue >= Number(filters.yearFrom))) &&
      (!filters.yearTo || (Number.isFinite(yearToValue) && yearToValue <= Number(filters.yearTo))) &&
      (!filters.minPrice || (Number.isFinite(priceValue) && priceValue >= Number(filters.minPrice))) &&
      (!filters.maxPrice || (Number.isFinite(priceValue) && priceValue <= Number(filters.maxPrice)))
    );
  }).sort((a, b) => {
    if (filters.sortBy === 'price_low') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (filters.sortBy === 'price_high') return (Number(b.price) || 0) - (Number(a.price) || 0);
    if (filters.sortBy === 'newest') {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    }
    if (filters.sortBy === 'oldest') {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA - dateB;
    }
    return 0;
  }).filter(product => {
    if (filters.sortBy === 'activated') return product.isAvailable;
    if (filters.sortBy === 'deactivated') return !product.isAvailable;
    if (filters.sortBy === 'discounted') return Number(product.discount) > 0;
    if (filters.sortBy === 'non_discounted') return !product.discount || Number(product.discount) === 0;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleResetFilters = () => {
    setFilters({
      category: '',
      vehicleType: '',
      brand: '',
      vehicleBrand: '',
      vehicleModel: '',
      yearFrom: '',
      yearTo: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'default'
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'vehicleType') {
      setFormData((prev) => ({
        ...prev,
        vehicleType: value,
        vehicleBrand: '',
        vehicleModel: ''
      }));
      return;
    }

    if (name === 'vehicleBrand') {
      setFormData((prev) => ({
        ...prev,
        vehicleBrand: value,
        vehicleModel: ''
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleImageInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    // Also clear the saved image from form data so it doesn't re-upload
    setFormData((prev) => ({
      ...prev,
      image: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInputModeChange = (fieldName, mode) => {
    setInputModes((prev) => ({
      ...prev,
      [fieldName]: mode
    }));
    // Do NOT clear the value when switching modes - preserve the field content
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.itemId || formData.itemId.trim().length === 0) {
      toast.error('OEM code is required');
      return;
    }
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error('Product name must be at least 2 characters');
      return;
    }
    if (!formData.brand) {
      toast.error('Brand is required');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.vehicleType) {
      toast.error('Vehicle type is required');
      return;
    }
    if (!formData.vehicleBrand) {
      toast.error('Vehicle brand is required');
      return;
    }
    if (!formData.vehicleModel) {
      toast.error('Vehicle model is required');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    const discountNum = formData.discount ? Number(formData.discount) : 0;
    if (discountNum < 0) {
      toast.error('Discount cannot be negative');
      return;
    }
    if (discountNum > 100) {
      toast.error('Discount cannot exceed 100%');
      return;
    }
    if (formData.stockQuantity && Number(formData.stockQuantity) < 0) {
      toast.error('Stock quantity cannot be negative');
      return;
    }
    if (!formData.yearFrom || formData.yearFrom === '') {
      toast.error('Year From is required');
      return;
    }
    if (!formData.yearTo || formData.yearTo === '') {
      toast.error('Year To is required');
      return;
    }
    if (Number(formData.yearFrom) > Number(formData.yearTo)) {
      toast.error('Year From must be less than or equal to Year To');
      return;
    }
    if (!formData.warrantyPeriod && formData.warrantyPeriod !== 0) {
      toast.error('Warranty period is required');
      return;
    }
    const warrantyNum = Number(formData.warrantyPeriod);
    if (warrantyNum < 0) {
      toast.error('Warranty period cannot be negative');
      return;
    }

    try {
      const alternativeNamesArray = formData.alternativeNames
        ? formData.alternativeNames
            .split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0)
        : [];

      const data = {
        itemId: formData.itemId.trim(),
        name: formData.name.trim(),
        brand: formData.brand,
        category: formData.category,
        vehicleType: formData.vehicleType,
        vehicleBrand: formData.vehicleBrand,
        vehicleModel: formData.vehicleModel,
        description: formData.description,
        price: Number(formData.price),
        discount: discountNum,
        image: typeof formData.image === 'string' ? formData.image.trim() : '',
        warrantyPeriod: formData.warrantyPeriod ? Number(formData.warrantyPeriod) : 0,
        stockQuantity: formData.stockQuantity ? Number(formData.stockQuantity) : null,
        yearFrom: formData.yearFrom ? Number(formData.yearFrom) : null,
        yearTo: formData.yearTo ? Number(formData.yearTo) : null,
        alternativeNames: alternativeNamesArray
      };

      if (imageFile) {
        const formDataToSend = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === 'alternativeNames') {
            formDataToSend.append(key, JSON.stringify(data[key]));
          } else if (key === 'image') {
            // Skip appending image from data, we'll append the file separately
          } else {
            formDataToSend.append(key, data[key] !== null && data[key] !== undefined ? data[key] : '');
          }
        });
        formDataToSend.append('image', imageFile);
        
        if (editingProduct) {
          await api.put(`/products/${editingProduct._id}`, formDataToSend);
          toast.success('Product updated');
        } else {
          await api.post('/products', formDataToSend);
          toast.success('Product created');
        }
      } else {
        if (editingProduct) {
          await api.put(`/products/${editingProduct._id}`, data);
          toast.success('Product updated');
        } else {
          await api.post('/products', data);
          toast.success('Product created');
        }
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setImageFile(null);

    // Helper function to safely normalize alternativeNames from multiple formats
    const normalizeAlternativeNames = (value) => {
      if (Array.isArray(value)) {
        // It's already an array - join with comma-space
        return value.filter(n => n && n.trim()).join(', ');
      }
      if (typeof value === 'string') {
        // Check if it looks like stringified JSON
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.filter(n => n && String(n).trim()).join(', ');
            }
          } catch (e) {
            // Not valid JSON, treat as plain string
          }
        }
        // Return as-is (already comma-separated or plain)
        return trimmed;
      }
      return '';
    };

    // Helper function to detect if a value exists in dropdown options
    const valueExistsInOptions = (value, options) => {
      return options.some(opt => String(opt) === String(value));
    };

    const formDataToSet = {
      itemId: product.itemId ?? product.oemCode ?? '',
      name: product.name ?? product.productName ?? '',
      brand: product.brand ?? '',
      category: product.category ?? '',
      vehicleType: product.vehicleType ?? '',
      vehicleBrand: product.vehicleBrand ?? '',
      vehicleModel: product.vehicleModel ?? '',
      description: product.description ?? '',
      price: product.price ?? '',
      discount: product.discount ?? '',
      image: product.image ?? product.imageUrl ?? '',
      warrantyPeriod: product.warrantyPeriod ?? product.warrantyPeriodMonths ?? '',
      stockQuantity: product.stockQuantity ?? '',
      yearFrom: product.yearFrom ?? '',
      yearTo: product.yearTo ?? '',
      alternativeNames: normalizeAlternativeNames(product.alternativeNames)
    };

    // Auto-detect dropdown vs manual mode based on whether values exist in option lists
    const newInputModes = {
      brand: valueExistsInOptions(formDataToSet.brand, productBrands) ? 'dropdown' : 'manual',
      category: valueExistsInOptions(formDataToSet.category, productCategories) ? 'dropdown' : 'manual',
      vehicleType: valueExistsInOptions(formDataToSet.vehicleType, vehicleTypes) ? 'dropdown' : 'manual',
      vehicleBrand: valueExistsInOptions(formDataToSet.vehicleBrand, brands) ? 'dropdown' : 'manual',
      vehicleModel: valueExistsInOptions(formDataToSet.vehicleModel, vehicleModelDropdownOptions) ? 'dropdown' : 'manual',
      warrantyPeriod: valueExistsInOptions(formDataToSet.warrantyPeriod, warrantyOptions) ? 'dropdown' : 'manual'
    };

    setFormData(formDataToSet);
    setInputModes(newInputModes);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ isOpen: true, productId: id });
  };

  const handleConfirmDelete = async () => {
    const productId = deleteConfirmation.productId;
    setDeleteConfirmation({ isOpen: false, productId: null });

    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product removed');
      fetchProducts();
    } catch (error) {
      toast.error('Error removing product');
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      await api.patch(`/products/${id}/toggle-availability`);
      toast.success(`Product ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Error updating product availability');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setImageFile(null);

    setFormData({
      itemId: '',
      name: '',
      brand: '',
      category: '',
      vehicleType: '',
      vehicleBrand: '',
      vehicleModel: '',
      description: '',
      price: '',
      discount: '',
      image: '',
      warrantyPeriod: '',
      stockQuantity: '',
      yearFrom: '',
      yearTo: '',
      alternativeNames: ''
    });

    setInputModes({
      brand: 'dropdown',
      category: 'dropdown',
      vehicleType: 'dropdown',
      vehicleBrand: 'dropdown',
      vehicleModel: 'dropdown',
      warrantyPeriod: 'dropdown'
    });
  };

  const getDiscountedPrice = (product) => {
    // Use finalPrice from backend if available, otherwise calculate it
    if (product.finalPrice && Number(product.finalPrice) > 0) {
      return product.finalPrice;
    }
    // Fallback calculation: finalPrice = price - (price * discount / 100)
    if (product.discount && Number(product.discount) > 0) {
      return Number(product.price) - (Number(product.price) * Number(product.discount) / 100);
    }
    return null;
  };

  const currentVehicleBrands = brands;

  const categoryOptions = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  const vehicleTypeOptions = [...new Set(products.map((product) => product.vehicleType).filter(Boolean))].sort();
  const brandOptions = [...new Set(products.map((product) => product.brand).filter(Boolean))].sort();
  const vehicleBrandOptions = [...new Set(products.map((product) => product.vehicleBrand).filter(Boolean))].sort();
  const vehicleModelOptions = [...new Set(products.map((product) => product.vehicleModel).filter(Boolean))].sort();

  const sortByOptions = [
    { value: 'default', label: 'Default Order' },
    { value: 'price_low', label: 'Price Low to High' },
    { value: 'price_high', label: 'Price High to Low' },
    { value: 'activated', label: 'Activated Products' },
    { value: 'deactivated', label: 'Deactivated Products' },
    { value: 'newest', label: 'Newest to Older' },
    { value: 'oldest', label: 'Older to Newest' },
    { value: 'discounted', label: 'Discounted Products' },
    { value: 'non_discounted', label: 'Non Discounted Products' }
  ];

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ProductManagementSidebar active="all-products" />
          <main className="space-y-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white">Products</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/admin/products/history')}
                  className="btn-secondary inline-flex items-center"
                >
                  <FiClock className="mr-2" /> Product History
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="btn-primary inline-flex items-center"
                >
                  <FiPlus className="mr-2" /> Add Product
                </button>
              </div>
            </div>

            <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 mb-6 p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Vehicle Type</label>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">All Types</option>
                    {vehicleTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) => setFilters((prev) => ({ ...prev, brand: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">All Brands</option>
                    {brandOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Vehicle Brand</label>
                  <select
                    value={filters.vehicleBrand}
                    onChange={(e) => setFilters((prev) => ({ ...prev, vehicleBrand: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">All Vehicle Brands</option>
                    {vehicleBrandOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Vehicle Model</label>
                  <select
                    value={filters.vehicleModel}
                    onChange={(e) => setFilters((prev) => ({ ...prev, vehicleModel: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">All Models</option>
                    {vehicleModelOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    {sortByOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 mt-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year From</label>
                  <select
                    value={filters.yearFrom}
                    onChange={(e) => setFilters((prev) => ({ ...prev, yearFrom: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">Any</option>
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Year To</label>
                  <select
                    value={filters.yearTo}
                    onChange={(e) => setFilters((prev) => ({ ...prev, yearTo: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4 pr-10"
                  >
                    <option value="">Any</option>
                    {yearOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Min Price</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4"
                    placeholder="Min"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                    className="input-field w-full min-w-0 h-11 text-xs px-4"
                    placeholder="Max"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full h-11 text-sm font-medium text-white bg-dark-800 border border-dark-700/50 rounded-xl hover:bg-dark-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 mb-6">
              <div className="p-4 flex items-center">
                <FiSearch className="text-dark-400 mr-3" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-white placeholder-dark-400"
                />
              </div>
            </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-dark-800/40 backdrop-blur-xl rounded-2xl border border-dark-700/50 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-dark-800/60">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-dark-400 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase whitespace-nowrap">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Assigned Details</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase whitespace-nowrap">Available Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-dark-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/50">
                {paginatedProducts.map((product, index) => {
                  const discountedPrice = getDiscountedPrice(product);
                  const hasDiscount = Number(product.discount) > 0;

                  return (
                    <tr key={product._id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-4 text-center text-sm text-dark-400 w-12">{startIndex + index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${product._id}`)}
                            className="flex-shrink-0 focus:outline-none"
                          >
                            <img
                              src={product.image || 'https://via.placeholder.com/40'}
                              alt={product.name || 'Product image'}
                              className="w-10 h-10 rounded object-cover"
                            />
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/products/${product._id}`)}
                              className="font-medium text-white truncate text-sm text-left hover:text-primary-400 transition-colors focus:outline-none"
                            >
                              {product.name}
                            </button>
                            <p className="text-xs text-dark-400 truncate">{product.itemId || 'No ID'}</p>
                            <p className="text-[10px] text-dark-500 truncate">{product.productId || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-dark-300 whitespace-nowrap text-sm">{product.category || '-'}</td>
                      <td className="px-4 py-4 text-dark-300 whitespace-nowrap text-sm">{product.brand || '-'}</td>
                      <td className="px-4 py-4 text-sm text-dark-300">
                        <div className="space-y-1">
                          <div className="whitespace-nowrap text-pink-400">
                            {Number(product.discount) > 0 ? `Discount: ${product.discount}%` : 'No Discount'}
                          </div>
                          <div className="whitespace-nowrap text-blue-400">Warranty: {product.warrantyPeriod ? `${product.warrantyPeriod} Months` : 'No Warranty'}</div>
                          {product.yearFrom && product.yearTo && (
                            <div className="whitespace-nowrap text-gray-400 text-xs">Since {product.yearFrom} to {product.yearTo}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {hasDiscount ? (
                          <div className="space-y-0.5">
                            <span className="font-medium text-primary-400 block">Rs. {discountedPrice.toLocaleString()}</span>
                            <span className="text-xs text-dark-500 line-through block">Rs. {Number(product.price).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-white block">Rs. {Number(product.price).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 text-xs rounded-full border ${
                            product.isAvailable
                              ? 'border-green-600 text-green-400 bg-green-500/5'
                              : 'border-orange-600 text-orange-400 bg-orange-500/5'
                          }`}
                        >
                          {product.isAvailable ? 'Activated' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              product.isAvailable
                                ? 'text-orange-400 hover:text-orange-300'
                                : 'text-green-400 hover:text-green-300'
                            }`}
                            title={product.isAvailable ? 'Deactivate' : 'Activate'}
                          >
                            {product.isAvailable ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-white bg-dark-800 border border-dark-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-400 bg-dark-800 border border-dark-700/50 hover:bg-dark-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-white bg-dark-800 border border-dark-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-xl">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {editingProduct ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-dark-400 mb-6">
                  Enter detailed product information including vehicle type, brand, pricing, discounts and stock.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* OEM Code */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">OEM Code *</label>
                      <input
                        type="text"
                        name="itemId"
                        value={formData.itemId}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Unique OEM code"
                        required
                      />
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Product Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Min 2 characters"
                        minLength="2"
                        required
                      />
                    </div>

                    {/* Alternative Names */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Alternative Names</label>
                      <input
                        type="text"
                        name="alternativeNames"
                        value={formData.alternativeNames}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Comma separated, e.g., brake pad, front brake pad, disc pad"
                      />
                      <p className="text-xs text-dark-400 mt-1">Optional: Enter multiple names separated by commas. Spaces will be trimmed automatically.</p>
                    </div>

                    {/* Product Brand (Type/Dropdown) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Product Brand *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="brand-mode"
                              value="dropdown"
                              checked={inputModes.brand === 'dropdown'}
                              onChange={() => handleInputModeChange('brand', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="brand-mode"
                              value="manual"
                              checked={inputModes.brand === 'manual'}
                              onChange={() => handleInputModeChange('brand', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.brand === 'dropdown' ? (
                        <select
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select brand</option>
                          {productBrands.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="brand"
                          value={formData.brand}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Type brand name"
                          required
                        />
                      )}
                    </div>

                    {/* Product Category (Type/Dropdown) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Category *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="category-mode"
                              value="dropdown"
                              checked={inputModes.category === 'dropdown'}
                              onChange={() => handleInputModeChange('category', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="category-mode"
                              value="manual"
                              checked={inputModes.category === 'manual'}
                              onChange={() => handleInputModeChange('category', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.category === 'dropdown' ? (
                        <select
                          name="category"
                          value={formData.category || ''}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select category</option>
                          {productCategories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Type category name"
                          required
                        />
                      )}
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Price (Rs.) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Must be > 0"
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>

                    {/* Discount */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="0 - 100 (optional)"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>

                    {/* Vehicle Type (Type/Dropdown) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Vehicle Type *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleType-mode"
                              value="dropdown"
                              checked={inputModes.vehicleType === 'dropdown'}
                              onChange={() => handleInputModeChange('vehicleType', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleType-mode"
                              value="manual"
                              checked={inputModes.vehicleType === 'manual'}
                              onChange={() => handleInputModeChange('vehicleType', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.vehicleType === 'dropdown' ? (
                        <select
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select vehicle type</option>
                          {vehicleTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Type vehicle type"
                          required
                        />
                      )}
                    </div>

                    {/* Vehicle Brand (Type/Dropdown) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Vehicle Brand *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleBrand-mode"
                              value="dropdown"
                              checked={inputModes.vehicleBrand === 'dropdown'}
                              onChange={() => handleInputModeChange('vehicleBrand', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleBrand-mode"
                              value="manual"
                              checked={inputModes.vehicleBrand === 'manual'}
                              onChange={() => handleInputModeChange('vehicleBrand', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.vehicleBrand === 'dropdown' ? (
                        <select
                          name="vehicleBrand"
                          value={formData.vehicleBrand}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select vehicle brand</option>
                          {brands.map((brand) => (
                            <option key={brand} value={brand}>
                              {brand}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="vehicleBrand"
                          value={formData.vehicleBrand}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Type vehicle brand"
                          required
                        />
                      )}
                    </div>

                    {/* Vehicle Model (Type/Dropdown) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Vehicle Model *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleModel-mode"
                              value="dropdown"
                              checked={inputModes.vehicleModel === 'dropdown'}
                              onChange={() => handleInputModeChange('vehicleModel', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="vehicleModel-mode"
                              value="manual"
                              checked={inputModes.vehicleModel === 'manual'}
                              onChange={() => handleInputModeChange('vehicleModel', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.vehicleModel === 'dropdown' ? (
                        <select
                          name="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select vehicle model</option>
                          {vehicleModelDropdownOptions.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          name="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Type vehicle model"
                          required
                        />
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Product Image</label>
                      
                      {/* Drag and Drop Zone */}
                      <div
                        onDragOver={handleImageDragOver}
                        onDrop={handleImageDrop}
                        className="border-2 border-dashed border-dark-500 rounded-xl p-6 text-center cursor-pointer hover:border-dark-400 hover:bg-dark-900/50 transition"
                      >
                        {imageFile ? (
                          <div>
                            <p className="text-sm text-green-400 font-medium mb-3">✓ File selected: {imageFile.name}</p>
                            <p className="text-xs text-dark-500 mb-3">({(imageFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                            <img
                              src={URL.createObjectURL(imageFile)}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border border-dark-600 mx-auto"
                            />
                          </div>
                        ) : formData.image ? (
                          <div>
                            <p className="text-sm text-blue-400 font-medium mb-3">Current Image</p>
                            <img
                              src={formData.image}
                              alt="Current"
                              className="w-32 h-32 object-cover rounded-lg border border-dark-600 mx-auto"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <p className="text-dark-300 text-sm mb-1">Drag and drop image here or click to browse</p>
                            <p className="text-xs text-dark-500">JPEG, PNG, GIF, or WebP • Max 5MB</p>
                          </div>
                        )}
                      </div>

                      {/* File Input (Hidden) */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="imageInput"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageInputChange}
                        className="hidden"
                      />

                      {/* Buttons */}
                      <div className="flex gap-2 mt-3">
                        <label htmlFor="imageInput" className="flex-1">
                          <button
                            type="button"
                            onClick={() => document.getElementById('imageInput').click()}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                          >
                            Browse Image
                          </button>
                        </label>
                        {(imageFile || formData.image) && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>


                    {/* Warranty Period */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-dark-300">Warranty Period (Months) *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="warrantyPeriod-mode"
                              value="dropdown"
                              checked={inputModes.warrantyPeriod === 'dropdown'}
                              onChange={() => handleInputModeChange('warrantyPeriod', 'dropdown')}
                              className="mr-1"
                            />
                            Dropdown
                          </label>
                          <label className="flex items-center text-xs text-dark-400 cursor-pointer">
                            <input
                              type="radio"
                              name="warrantyPeriod-mode"
                              value="manual"
                              checked={inputModes.warrantyPeriod === 'manual'}
                              onChange={() => handleInputModeChange('warrantyPeriod', 'manual')}
                              className="mr-1"
                            />
                            Manual
                          </label>
                        </div>
                      </div>
                      {inputModes.warrantyPeriod === 'dropdown' ? (
                        <select
                          name="warrantyPeriod"
                          value={formData.warrantyPeriod}
                          onChange={handleChange}
                          className="input-field"
                          required
                        >
                          <option value="">Select warranty period</option>
                          <option value="0">No Warranty</option>
                          {warrantyOptions.filter(month => month !== 0).map((month) => (
                            <option key={month} value={month}>
                              {month} months
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          name="warrantyPeriod"
                          value={formData.warrantyPeriod}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Enter months (e.g., 12)"
                          min="0"
                          required
                        />
                      )}
                    </div>

                    {/* Stock Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Stock Quantity</label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Optional"
                        min="0"
                      />
                    </div>

                    {/* Year From */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Year From *</label>
                      <select
                        name="yearFrom"
                        value={formData.yearFrom}
                        onChange={handleChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year To */}
                    <div>
                      <label className="block text-sm font-medium text-dark-300 mb-2">Year To *</label>
                      <select
                        name="yearTo"
                        value={formData.yearTo}
                        onChange={handleChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field"
                        rows={4}
                        placeholder="Optional product description"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-md backdrop-blur-xl shadow-2xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-3">Remove Product</h2>
                <p className="text-dark-300 mb-8 leading-relaxed">
                  This product will be removed from the main products list and can be viewed later in Product History.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: false, productId: null })}
                    className="flex-1 px-4 py-3 rounded-lg border border-dark-600 text-dark-300 font-medium hover:bg-dark-800/50 hover:border-dark-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;