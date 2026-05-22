import { useNavigate } from 'react-router-dom';

const ProductManagementSidebar = ({ active }) => {
  const navigate = useNavigate();

  const buttonClass = (section) =>
    `w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transitio-colors ${
      active === section
        ? 'bg-primary-500 text-white border border-primary-500 hover:bg-primary-400'
        : 'text-white bg-dark-800 border border-dark-700/70 hover:bg-dark-700'
    }`;

  return (
    <aside className="bg-dark-900 border border-dark-700/50 rounded-3xl p-6 shadow-xl shadow-black/20 w-full max-w-[240px] min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Manage products</h2>
        <p className="mt-3 text-sm text-dark-400">Overview and all products.</p>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/admin/products/overview')}
          className={buttonClass('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className={buttonClass('all-products')}
        >
          All Products
        </button>
      </div>
    </aside>
  );
};

export default ProductManagementSidebar;
