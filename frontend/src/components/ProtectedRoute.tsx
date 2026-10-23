import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '../utils/appContext';

function ProtectedRoute() {
  const { userId, userRole } = useAppContext();
  const location = useLocation();

  return userId && userRole
    ? <Outlet />
    : <Navigate to="/auth" replace state={{ from: location }} />;
}

export default ProtectedRoute;
