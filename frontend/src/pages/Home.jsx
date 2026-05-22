import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiShield, FiClock, FiAward, FiArrowRight, FiZap, FiStar } from 'react-icons/fi';
import api from '../services/api';

const Home = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
    fetchCategoryStats();
  }, []);

  const fetchTopProducts = async () => {
    try {
      const response = await api.get('/products/top-rated');
      setTopProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const response = await api.get('/products/category-stats');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching category stats:', error);
      setCategories([]);
    }
  };

  const features = [
    { icon: FiTruck, title: 'Fast Delivery', description: 'Quick shipping across the country', color: 'from-blue-500 to-blue-600' },
    { icon: FiShield, title: 'Warranty Protection', description: 'All products come with warranty', color: 'from-green-500 to-green-600' },
    { icon: FiClock, title: '24/7 Support', description: 'Round the clock customer service', color: 'from-purple-500 to-purple-600' },
    { icon: FiAward, title: 'Quality Assured', description: 'Only genuine spare parts', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: "url('https://img.freepik.com/free-photo/bipoc-specialist-car-service-using-professional-mechanical-tool-repair-broken-ignition-system-licensed-specialist-garage-fixing-client-automobile-ensuring-optimal-automotive-performance_482257-73049.jpg?semt=ais_hybrid&w=740&q=80')"
      }}
    >
      <div className="absolute inset-0 bg-dark-950/80"></div>
      <div className="relative z-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-2">
                <FiZap className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-primary-300 font-medium">Premium Auto Parts</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Quality That</span>
                <br />
                <span className="gradient-text">Keeps You Moving</span>
              </h1>

              <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
                Find genuine auto parts for all vehicle types. Fast delivery, warranty protection, and expert support for every purchase.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary inline-flex items-center group">
                  Shop Now
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/services" className="btn-secondary inline-flex items-center">
                  Our Services
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-2xl"></div>
                <img
                  src="https://www.spinny.com/blog/wp-content/uploads/2025/02/Lamborghini-Revuelto-1160x653.webp"
                  alt="Car"
                  className="relative rounded-3xl shadow-2xl border border-dark-700/50"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-dark-800/90 backdrop-blur-xl border border-dark-600/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                    <FiShield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Warranty Protected</p>
                    <p className="text-sm text-gray-400">All products covered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center group hover:border-primary-500/30 transition-all duration-300">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Categories */}
      < section className="py-20 relative" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Browse by Category</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Find the right parts for your vehicle from our extensive collection</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.slice(0, 4).map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${encodeURIComponent(category.name)}`}
                className="group relative overflow-hidden rounded-2xl aspect-square card-hover"
              >
                <img
                  src={category.image || 'https://via.placeholder.com/400?text=Category'}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent"></div>
                <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-colors duration-300"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-semibold text-lg text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-400">{category.count} Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section >

      {/* Top Rated Products */}
      < section className="py-20 relative" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Top Rated Products</h2>
              <p className="text-gray-400">Best sellers loved by our customers</p>
            </div>
            <Link to="/products?sortBy=rating" className="text-primary-400 hover:text-primary-300 font-medium inline-flex items-center group">
              View All <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {topProducts.slice(0, 5).map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="card-hover group">
                  <div className="aspect-square bg-dark-700/50 relative overflow-hidden rounded-t-2xl">
                    <img
                      src={typeof product.image === 'string' && product.image.trim() ? product.image : 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                    {product.discountPrice && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                        Sale
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-200 line-clamp-2 mb-2 group-hover:text-primary-400 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-2">
                      {product.discountPrice ? (
                        <>
                          <span className="font-bold text-primary-400">Rs. {product.discountPrice.toLocaleString()}</span>
                          <span className="text-sm text-gray-500 line-through">Rs. {product.price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="font-bold text-white">Rs. {product.price.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 text-sm">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.averageRating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">({product.totalReviews})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section >

      {/* CTA Section */}
      < section className="py-20 relative overflow-hidden" >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/50 to-accent-900/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Need Professional Service?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Book an appointment with our expert technicians for maintenance, repairs, and more.
          </p>
          <Link to="/services" className="btn-accent inline-flex items-center group">
            Book a Service <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section >
      </div>
    </div >
  );
};

export default Home;
