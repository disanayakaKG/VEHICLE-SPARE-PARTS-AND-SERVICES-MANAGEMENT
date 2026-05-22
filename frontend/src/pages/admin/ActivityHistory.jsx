import { useNavigate } from 'react-router-dom';
import ProductManagementSidebar from '../../components/ProductManagementSidebar';

const AdminActivityHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <ProductManagementSidebar active="activity-history" />
          <main className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Activity History</h1>
                <p className="mt-2 text-sm text-dark-400">
                  This page is reserved for future product activity tracking features.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-dark-700/50 bg-dark-900/50 p-10 text-center">
              <p className="text-dark-400">This page is reserved for future product activity tracking features.</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityHistory;
