import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is delivery or supplier, they shouldn't access standard protected routes (profile, orders, etc)
  if (user.role === 'delivery') {
    return <Navigate to="/delivery-dashboard" replace />;
  }

  if (user.role === 'supplier') {
    return <Navigate to="/supplier/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
