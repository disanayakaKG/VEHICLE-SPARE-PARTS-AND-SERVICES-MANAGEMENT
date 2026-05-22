const Product = require('../models/Product');
const { Inventory } = require('../models/Inventory');

const mergeInventoryStock = async (productDocs) => {
  if (!productDocs || productDocs.length === 0) return [];

  const productIds = productDocs.map((product) => product._id);
  const inventoryRows = await Inventory.find({ product: { $in: productIds } })
    .select('product currentStock')
    .lean();

  const stockByProductId = new Map(
    inventoryRows.map((row) => [String(row.product), row.currentStock])
  );

  return productDocs.map((product) => {
    const key = String(product._id);
    const inventoryStock = stockByProductId.get(key);
    if (inventoryStock === undefined) return product;
    return { ...product, stockQuantity: inventoryStock };
  });
};

const syncInventoryForProduct = async (productId, stockQuantity, minStockLevel) => {
  if (stockQuantity === undefined || stockQuantity === null || Number.isNaN(Number(stockQuantity))) {
    return null;
  }

  const normalizedStock = Math.max(0, Number(stockQuantity));
  let inventory = await Inventory.findOne({ product: productId });
  if (!inventory) {
    // Keep product and inventory decoupled at creation time.
    // Inventory must be created explicitly from Inventory module.
    return null;
  }
  inventory.currentStock = normalizedStock;
  if (minStockLevel !== undefined && minStockLevel !== null && !Number.isNaN(Number(minStockLevel))) {
    inventory.minStockLevel = Math.max(0, Number(minStockLevel));
  }

  await inventory.save();
  await Product.findByIdAndUpdate(productId, { stockQuantity: inventory.currentStock });
  return inventory.currentStock;
};

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, vehicleType, vehicleBrand, search, sortBy, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

    // Keep public list aligned with admin-managed products (active admin products only)
    // Exclude legacy/unwanted seed rows by requiring admin-style product IDs and null supplier
    let query = {
      isActive: true,
      supplier: null,
      productId: /^PROD-/,
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } }
      ]
    };

    if (category) query.category = category;
    if (vehicleType) query.vehicleType = vehicleType;
    if (vehicleBrand) query.vehicleBrand = new RegExp(vehicleBrand, 'i');
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { itemId: new RegExp(search, 'i') },
        { alternativeNames: new RegExp(search, 'i') }
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sortBy) {
      case 'price_low': sortOption = { price: 1 }; break;
      case 'price_high': sortOption = { price: -1 }; break;
      case 'rating': sortOption = { averageRating: -1 }; break;
      case 'newest': sortOption = { createdAt: -1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('supplier', 'name');

    // Convert to plain objects to preserve virtual fields while supporting stock merge
    const productsWithLiveStock = await mergeInventoryStock(products.map(p => p.toObject ? p.toObject({ virtuals: true }) : p));

    res.json({
      products: productsWithLiveStock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products for admin (includes deactivated products)
// @route   GET /api/products/admin/all
const getAdminProducts = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    let query = { isActive: true, supplier: null };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { itemId: new RegExp(search, 'i') },
        { alternativeNames: new RegExp(search, 'i') }
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .populate('supplier', 'name');

    // Convert to plain objects to preserve virtual fields while supporting stock merge
    const productsWithLiveStock = await mergeInventoryStock(products.map(p => p.toObject ? p.toObject({ virtuals: true }) : p));

    res.json({
      products: productsWithLiveStock,
      totalPages: Math.ceil(total / limit),
      currentPage: 1,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin-managed products for suppliers
// @route   GET /api/products/admin-list
const getAdminProductsForSuppliers = async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    let query = { isActive: true, supplier: null };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { itemId: new RegExp(search, 'i') },
        { alternativeNames: new RegExp(search, 'i') }
      ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: 1,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get top rated products
// @route   GET /api/products/top-rated
const getTopRatedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      averageRating: { $gte: 4 },
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } }
      ]
    })
      .sort({ averageRating: -1 })
      .limit(10)
      .then(docs => docs.map(doc => doc.toObject({ virtuals: true })));

    const productsWithLiveStock = await mergeInventoryStock(products);
    res.json(productsWithLiveStock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      $or: [
        { isAvailable: true },
        { isAvailable: { $exists: false } }
      ]
    }).populate('supplier', 'name').then(doc => doc ? doc.toObject({ virtuals: true }) : null);
    if (product) {
      const [productWithLiveStock] = await mergeInventoryStock([product]);
      res.json(productWithLiveStock);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get one product by id for admin (includes inactive products)
// @route   GET /api/products/admin/:id
const getAdminProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id
    }).populate('supplier', 'name').then(doc => doc ? doc.toObject({ virtuals: true }) : null);
    if (product) {
      const [productWithLiveStock] = await mergeInventoryStock([product]);
      res.json(productWithLiveStock);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate unique product ID
const generateProductId = async () => {
  try {
    // Get all products with valid PROD- format productIds
    const allProducts = await Product.find({ productId: /^PROD-\d+$/ }).select('productId').sort({ createdAt: -1 });
    
    // If no valid products found, start from 0001
    if (!allProducts || allProducts.length === 0) {
      return 'PROD-0001';
    }
    
    // Find the highest number from valid productIds
    let maxNum = 0;
    for (const product of allProducts) {
      const num = parseInt(product.productId.split('-')[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    
    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `PROD-${nextNum}`;
  } catch (error) {
    console.error('Error generating product ID:', error);
    // Fallback: return a timestamp-based ID if generation fails
    return `PROD-${Date.now().toString().slice(-4).padStart(4, '0')}`;
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      itemId,
      name,
      brand,
      category,
      description,
      price,
      discount,
      vehicleType,
      vehicleBrand,
      vehicleModel,
      image,
      warrantyPeriod,
      stockQuantity,
      yearFrom,
      yearTo,
      alternativeNames
    } = req.body;

    // Validation
    if (!itemId || typeof itemId !== 'string' || !itemId.trim()) {
      return res.status(400).json({ message: 'Valid OEM code is required' });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Product name must be at least 2 characters' });
    }
    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      return res.status(400).json({ message: 'Brand is required' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!vehicleType || typeof vehicleType !== 'string' || !vehicleType.trim()) {
      return res.status(400).json({ message: 'Vehicle type is required' });
    }
    if (!vehicleBrand || typeof vehicleBrand !== 'string' || !vehicleBrand.trim()) {
      return res.status(400).json({ message: 'Vehicle brand is required' });
    }
    if (!vehicleModel || typeof vehicleModel !== 'string' || !vehicleModel.trim()) {
      return res.status(400).json({ message: 'Vehicle model is required' });
    }
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Price must be greater than 0' });
    }

    const priceNum = Number(price);
    const discountNum = discount ? Number(discount) : 0;

    if (discountNum < 0) {
      return res.status(400).json({ message: 'Discount cannot be negative' });
    }
    if (discountNum > 100) {
      return res.status(400).json({ message: 'Discount cannot exceed 100%' });
    }

    if (warrantyPeriod === undefined || warrantyPeriod === null || warrantyPeriod === '') {
      return res.status(400).json({ message: 'Warranty period is required' });
    }
    const warrantyNum = Number(warrantyPeriod);
    if (isNaN(warrantyNum)) {
      return res.status(400).json({ message: 'Warranty period must be a number' });
    }
    if (warrantyNum < 0) {
      return res.status(400).json({ message: 'Warranty period cannot be negative' });
    }

    if (!yearFrom || yearFrom === '') {
      return res.status(400).json({ message: 'Year From is required' });
    }
    if (!yearTo || yearTo === '') {
      return res.status(400).json({ message: 'Year To is required' });
    }
    const yearFromNum = Number(yearFrom);
    const yearToNum = Number(yearTo);
    if (isNaN(yearFromNum)) {
      return res.status(400).json({ message: 'Year From must be a valid number' });
    }
    if (isNaN(yearToNum)) {
      return res.status(400).json({ message: 'Year To must be a valid number' });
    }
    if (yearFromNum > yearToNum) {
      return res.status(400).json({ message: 'Year From must be less than or equal to Year To' });
    }

    // Normalize itemId (OEM Code) - uppercase and trim
    const normalizedItemId = itemId.trim().toUpperCase();

    // Check itemId uniqueness with normalized value
    const existingProduct = await Product.findOne({ itemId: normalizedItemId });
    if (existingProduct) {
      return res.status(400).json({ message: 'OEM code already exists' });
    }

    // Generate productId
    const generatedProductId = await generateProductId();

    // Helper: Normalize alternativeNames to always be an array
    const normalizeAlternativeNames = (value) => {
      if (Array.isArray(value)) return value.filter(n => n && String(n).trim());
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed.filter(n => n && String(n).trim());
          } catch (e) {}
        }
        return trimmed ? trimmed.split(',').map(n => n.trim()).filter(n => n) : [];
      }
      return [];
    };

    // Prepare data
    // Handle image: prioritize uploaded file, fallback to URL string
    let imageValue = '';
    if (req.file) {
      // File was uploaded: store relative path for serving via /uploads
      imageValue = `/uploads/products/${req.file.filename}`;
    } else if (image) {
      // No file uploaded: use provided imageUrl string
      imageValue = typeof image === 'string' ? image.trim() : '';
    }

    const productData = {
      productId: generatedProductId,
      itemId: normalizedItemId,
      name: name.trim(),
      brand: brand.trim(),
      category: category.trim(),
      vehicleType: vehicleType.trim(),
      vehicleBrand: vehicleBrand.trim(),
      vehicleModel: vehicleModel.trim(),
      description: description ? description.trim() : '',
      price: priceNum,
      discount: discountNum,
      finalPrice: priceNum - (priceNum * discountNum / 100),
      image: imageValue,
      warrantyPeriod: warrantyNum,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
      yearFrom: yearFromNum,
      yearTo: yearToNum,
      alternativeNames: normalizeAlternativeNames(alternativeNames)
    };

    const product = new Product(productData);
    const createdProduct = await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: createdProduct
    });
  } catch (error) {
    // Handle duplicate key error for itemId (OEM Code)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.itemId) {
      return res.status(400).json({ message: 'OEM Code already exists. Please enter a different OEM Code.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { itemId, price, discount, stockQuantity, minStockLevel, warrantyPeriod, yearFrom, yearTo, ...otherData } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // If itemId is provided, normalize it and check for uniqueness
    if (itemId !== undefined && itemId !== null) {
      const normalizedItemId = itemId.trim().toUpperCase();
      
      // Check if normalized itemId already exists (excluding current product)
      const existingProduct = await Product.findOne({
        itemId: normalizedItemId,
        _id: { $ne: product._id }
      });
      
      if (existingProduct) {
        return res.status(400).json({ message: 'OEM code already exists' });
      }
      
      product.itemId = normalizedItemId;
    }

    // Validate warrantyPeriod if provided
    if (warrantyPeriod !== undefined && warrantyPeriod !== null) {
      if (warrantyPeriod === '') {
        return res.status(400).json({ message: 'Warranty period is required' });
      }
      const warrantyNum = Number(warrantyPeriod);
      if (isNaN(warrantyNum)) {
        return res.status(400).json({ message: 'Warranty period must be a number' });
      }
      if (warrantyNum < 0) {
        return res.status(400).json({ message: 'Warranty period cannot be negative' });
      }
      product.warrantyPeriod = warrantyNum;
    }

    // Validate yearFrom and yearTo if provided
    if (yearFrom !== undefined || yearTo !== undefined) {
      const currentYearFrom = yearFrom !== undefined ? yearFrom : product.yearFrom;
      const currentYearTo = yearTo !== undefined ? yearTo : product.yearTo;
      
      if (!currentYearFrom || currentYearFrom === '') {
        return res.status(400).json({ message: 'Year From is required' });
      }
      if (!currentYearTo || currentYearTo === '') {
        return res.status(400).json({ message: 'Year To is required' });
      }
      const yearFromNum = Number(currentYearFrom);
      const yearToNum = Number(currentYearTo);
      if (isNaN(yearFromNum)) {
        return res.status(400).json({ message: 'Year From must be a valid number' });
      }
      if (isNaN(yearToNum)) {
        return res.status(400).json({ message: 'Year To must be a valid number' });
      }
      if (yearFromNum > yearToNum) {
        return res.status(400).json({ message: 'Year From must be less than or equal to Year To' });
      }
      if (yearFrom !== undefined) product.yearFrom = yearFromNum;
      if (yearTo !== undefined) product.yearTo = yearToNum;
    }

    // Update basic fields
    Object.assign(product, otherData);

    // Normalize alternativeNames for consistency
    if (otherData.alternativeNames !== undefined) {
      const normalizeAlternativeNames = (value) => {
        if (Array.isArray(value)) return value.filter(n => n && String(n).trim());
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) return parsed.filter(n => n && String(n).trim());
            } catch (e) {}
          }
          return trimmed ? trimmed.split(',').map(n => n.trim()).filter(n => n) : [];
        }
        return [];
      };
      product.alternativeNames = normalizeAlternativeNames(otherData.alternativeNames);
    }

    // Handle image: prioritize uploaded file, fallback to URL string
    if (req.file) {
      // File was uploaded: store relative path for serving via /uploads
      product.image = `/uploads/products/${req.file.filename}`;
    } else if (otherData.image !== undefined) {
      // Update image from request body (URL string)
      product.image = otherData.image && typeof otherData.image === 'string' ? otherData.image.trim() : '';
    }

    // Update price and discount (will trigger finalPrice calculation in pre-save)
    if (price !== undefined) product.price = price;
    if (discount !== undefined) product.discount = discount;

    // Save to trigger pre-save middleware for finalPrice calculation
    await product.save();

    // Sync inventory if stockQuantity was provided
    if (stockQuantity !== undefined) {
      await syncInventoryForProduct(product._id, stockQuantity, minStockLevel);
      product = await Product.findById(product._id);
    }

    res.json(product);
  } catch (error) {
    // Handle duplicate key error for itemId (OEM Code)
    if (error.code === 11000 && error.keyPattern && error.keyPattern.itemId) {
      return res.status(400).json({ message: 'OEM Code already exists. Please enter a different OEM Code.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete product (Admin) - Soft delete
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isActive: false,
        removedAt: new Date()
      },
      { new: true }
    );
    if (product) {
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore product (Admin) - Restore soft-deleted product
// @route   PATCH /api/products/:id/restore
const restoreProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isActive: true,
        removedAt: null
      },
      { new: true }
    );
    if (product) {
      res.json({ message: 'Product restored successfully', product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle product availability status
// @route   PATCH /api/products/:id/toggle-availability
const toggleAvailability = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isAvailable = !product.isAvailable;
    const updatedProduct = await product.save();

    res.json({
      message: `Product ${updatedProduct.isAvailable ? 'activated' : 'deactivated'}`,
      product: updatedProduct
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get categories
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vehicle brands
// @route   GET /api/products/brands
const getVehicleBrands = async (req, res) => {
  try {
    const brands = await Product.distinct('vehicleBrand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get removed products (Admin)
// @route   GET /api/products/admin/removed
const getRemovedProducts = async (req, res) => {
  try {
    const { sortBy = 'removedAt', limit = 100, page = 1 } = req.query;

    let sortOption = {};
    switch (sortBy) {
      case 'name': sortOption = { name: 1 }; break;
      case 'price_low': sortOption = { finalPrice: 1 }; break;
      case 'price_high': sortOption = { finalPrice: -1 }; break;
      case 'removedAt': sortOption = { removedAt: -1 }; break;
      default: sortOption = { removedAt: -1 };
    }

    const total = await Product.countDocuments({ isActive: false });
    const products = await Product.find({ isActive: false })
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('supplier', 'name')
      .then(docs => docs.map(doc => doc.toObject({ virtuals: true })));

    const productsWithLiveStock = await mergeInventoryStock(products);

    res.json({
      products: productsWithLiveStock,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get category stats for homepage
// @route   GET /api/products/category-stats
const getCategoryStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { isAvailable: true },
            { isAvailable: { $exists: false } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          image: { $first: { $arrayElemAt: ['$images', 0] } }
        }
      },
      { $project: { _id: 0, name: '$_id', count: 1, image: 1 } },
      { $sort: { count: -1, name: 1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getAdminProductsForSuppliers,
  getTopRatedProducts,
  getProductById,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  toggleAvailability,
  getRemovedProducts,
  getCategories,
  getVehicleBrands,
  getCategoryStats
};
