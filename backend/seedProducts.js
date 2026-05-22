const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  discountPrice: Number,
  category: String,
  vehicleType: String,
  vehicleBrand: String,
  vehicleModel: String,
  partNumber: { type: String, unique: true },
  manufacturer: String,
  images: [String],
  stockQuantity: Number,
  minStockLevel: { type: Number, default: 10 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isTopRated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  warrantyPeriod: { type: Number, default: 6 }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const products = [
  {
    name: 'Toyota Corolla Brake Pads Set',
    description: 'High-quality ceramic brake pads for Toyota Corolla 2018-2023. Provides excellent stopping power and low dust.',
    price: 8500,
    discountPrice: 7500,
    category: 'Brake System',
    vehicleType: 'Car',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Corolla',
    partNumber: 'TBP-COR-2018',
    manufacturer: 'Brembo',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    stockQuantity: 50,
    warrantyPeriod: 12,
    averageRating: 4.8,
    totalReviews: 12
  },
  {
    name: 'Honda Civic Air Filter',
    description: 'OEM quality air filter for Honda Civic 2016-2021. Improves engine performance and fuel efficiency.',
    price: 2500,
    category: 'Engine Parts',
    vehicleType: 'Car',
    vehicleBrand: 'Honda',
    vehicleModel: 'Civic',
    partNumber: 'HAF-CIV-2016',
    manufacturer: 'Honda Genuine',
    images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500'],
    stockQuantity: 100,
    warrantyPeriod: 6,
    averageRating: 4.5,
    totalReviews: 8
  },
  {
    name: 'Nissan Sunny Shock Absorber Front',
    description: 'Premium front shock absorber for Nissan Sunny. Ensures smooth ride and better handling.',
    price: 12000,
    discountPrice: 10500,
    category: 'Suspension',
    vehicleType: 'Car',
    vehicleBrand: 'Nissan',
    vehicleModel: 'Sunny',
    partNumber: 'NSA-SUN-FR',
    manufacturer: 'KYB',
    images: ['https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500'],
    stockQuantity: 30,
    warrantyPeriod: 12,
    averageRating: 4.7,
    totalReviews: 15
  },
  {
    name: 'Universal LED Headlight Bulbs H4',
    description: 'Super bright LED headlight bulbs. 6000K white light, easy installation, fits most vehicles.',
    price: 4500,
    discountPrice: 3800,
    category: 'Electrical',
    vehicleType: 'Universal',
    vehicleBrand: 'Universal',
    partNumber: 'LED-H4-6000K',
    manufacturer: 'Philips',
    images: ['https://images.unsplash.com/photo-1558618047-f4b511e5b1e8?w=500'],
    stockQuantity: 200,
    warrantyPeriod: 12,
    averageRating: 4.9,
    totalReviews: 25
  },
  {
    name: 'Toyota Hilux Oil Filter',
    description: 'Genuine oil filter for Toyota Hilux diesel engines. Ensures clean oil circulation.',
    price: 1800,
    category: 'Engine Parts',
    vehicleType: 'Truck',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Hilux',
    partNumber: 'TOF-HIL-DSL',
    manufacturer: 'Toyota Genuine',
    images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500'],
    stockQuantity: 75,
    warrantyPeriod: 6,
    averageRating: 4.6,
    totalReviews: 10
  },
  {
    name: 'Suzuki Alto Clutch Plate',
    description: 'High-quality clutch plate for Suzuki Alto. Smooth engagement and long lasting.',
    price: 6500,
    category: 'Transmission',
    vehicleType: 'Car',
    vehicleBrand: 'Suzuki',
    vehicleModel: 'Alto',
    partNumber: 'SCP-ALT-001',
    manufacturer: 'Exedy',
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500'],
    stockQuantity: 25,
    warrantyPeriod: 6,
    averageRating: 4.4,
    totalReviews: 6
  },
  {
    name: 'Honda Bike Chain Sprocket Kit',
    description: 'Complete chain and sprocket kit for Honda motorcycles. Includes chain, front and rear sprockets.',
    price: 5500,
    discountPrice: 4800,
    category: 'Transmission',
    vehicleType: 'Motorcycle',
    vehicleBrand: 'Honda',
    partNumber: 'HCK-BIKE-001',
    manufacturer: 'DID',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
    stockQuantity: 40,
    warrantyPeriod: 6,
    averageRating: 4.7,
    totalReviews: 20
  },
  {
    name: 'Mitsubishi Lancer Radiator',
    description: 'Aluminum radiator for Mitsubishi Lancer. Excellent cooling performance.',
    price: 18000,
    discountPrice: 15500,
    category: 'Cooling System',
    vehicleType: 'Car',
    vehicleBrand: 'Mitsubishi',
    vehicleModel: 'Lancer',
    partNumber: 'MRD-LAN-001',
    manufacturer: 'Denso',
    images: ['https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500'],
    stockQuantity: 15,
    warrantyPeriod: 12,
    averageRating: 4.3,
    totalReviews: 5
  },
  {
    name: 'Universal Car Floor Mats Set',
    description: 'Premium rubber floor mats. Waterproof, easy to clean, fits most cars.',
    price: 3500,
    category: 'Interior',
    vehicleType: 'Universal',
    vehicleBrand: 'Universal',
    partNumber: 'UFM-RBR-001',
    manufacturer: 'AutoParts Pro',
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500'],
    stockQuantity: 100,
    warrantyPeriod: 3,
    averageRating: 4.2,
    totalReviews: 12
  },
  {
    name: 'Toyota Prius Hybrid Battery Cell',
    description: 'Replacement battery cell for Toyota Prius hybrid system. High capacity and reliable.',
    price: 45000,
    discountPrice: 42000,
    category: 'Electrical',
    vehicleType: 'Car',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Prius',
    partNumber: 'TPB-PRS-HYB',
    manufacturer: 'Panasonic',
    images: ['https://images.unsplash.com/photo-1558618047-f4b511e5b1e8?w=500'],
    stockQuantity: 10,
    warrantyPeriod: 24,
    averageRating: 4.9,
    totalReviews: 30
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const productsData = products.map((p, index) => ({
      ...p,
      productId: `PRD-SEED-${index}`,
      itemId: p.partNumber || `ITEM-SEED-${index}`
    }));
    await Product.insertMany(productsData);
    console.log(`Added ${products.length} products successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

seedProducts();
