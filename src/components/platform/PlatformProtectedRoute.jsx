import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';

const PlatformProtectedRoute = ({ children, allowedRoles }) => {
  const { isPlatformAuthenticated, role } = usePlatformAuthStore();
  const location = useLocation();

  if (!isPlatformAuthenticated) {
    return <Navigate to="/platform/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = role === 'owner' || allowedRoles.includes(role);
    if (!hasRole) {
      return <Navigate to="/platform/dashboard" replace />;
    }
  }

  return children;
};

export default PlatformProtectedRoute;
