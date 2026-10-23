import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import {
  AddPropertyRoute,
  ApplyRentalRoute,
  AuthRoute,
  CreateRequestsRoute,
  EditProfileRoute,
  ForgotPasswordRoute,
  MaintenanceRequestsRoute,
  PaymentCancelRoute,
  PaymentHistoryRoute,
  PaymentReturnRoute,
  PaymentSuccessRoute,
  ProfileRoute,
  PropertiesRoute,
  PropertyDetailsRoute,
  RentalApplicationsRoute,
  TerminateLeaseRoute,
  UpdatePropertyRoute,
} from './pages/RoutePages';
import { getUserFromToken } from './utils/auth';
import { authFetch } from './utils/api';
import { AppContext } from './utils/appContext';
import type { ProfileDataProps, Role } from './utils/props';

function AppRoutes() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<Role>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<{ userId: number; data: ProfileDataProps } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`Logout failed with status ${response.status}`);
    setUserRole(null);
    setUserId(null);
    navigate('/', { replace: true });
  }, [navigate]);

  useEffect(() => {
    getUserFromToken().then(result => {
      if (result) {
        setUserRole(result.userRole);
        setUserId(result.userId);
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userId || !userRole) return;

    const endpoint = userRole === 'landlord' ? '/api/landlords' : '/api/tenants';
    let cancelled = false;
    authFetch(`${import.meta.env.VITE_API_URL}${endpoint}/${userId}`)
      .then(async response => {
        if (!response.ok) throw new Error(`Profile request failed with status ${response.status}`);
        return response.json() as Promise<ProfileDataProps>;
      })
      .then(data => {
        if (!cancelled) setProfile({ userId, data });
      })
      .catch(error => {
        if (!cancelled) console.error('Error fetching profile:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, userRole]);

  useEffect(() => {
    window.addEventListener('unauthorized', handleLogout);
    return () => window.removeEventListener('unauthorized', handleLogout);
  }, [handleLogout]);

  const fullName = profile?.userId === userId
    ? [profile.data.first_name, profile.data.last_name].filter(Boolean).join(' ')
    : '';
  const outletContext = { userId, userRole, setUserId, setUserRole };

  return (
    <AppContext.Provider value={outletContext}>
      <Routes>
        <Route element={(
          <Layout
            userRole={userRole}
            fullName={fullName}
            onLogout={() => {
              void handleLogout().catch(error => console.error('Logout failed:', error));
            }}
          />
        )}>
          <Route index element={authLoading ? <p className="py-12 text-center text-sm text-gray-500">Loading...</p> : <PaymentReturnRoute />} />
          <Route path="auth" element={authLoading ? <p className="py-12 text-center text-sm text-gray-500">Loading...</p> : <AuthRoute />} />
          <Route path="forgot-password" element={authLoading ? <p className="py-12 text-center text-sm text-gray-500">Loading...</p> : <ForgotPasswordRoute />} />
          <Route path="properties/:propertyId" element={<PropertyDetailsRoute />} />

          <Route element={authLoading ? <p className="py-12 text-center text-sm text-gray-500">Loading...</p> : <ProtectedRoute />}>
            <Route path="profile" element={<ProfileRoute />} />
            <Route path="profile/edit" element={<EditProfileRoute />} />
            <Route path="my-properties" element={<PropertiesRoute />} />
            <Route path="my-rentals" element={<PropertiesRoute />} />
            <Route path="properties/new" element={<AddPropertyRoute />} />
            <Route path="properties/:propertyId/edit" element={<UpdatePropertyRoute />} />
            <Route path="properties/:propertyId/apply" element={<ApplyRentalRoute />} />
            <Route path="properties/:propertyId/terminate" element={<TerminateLeaseRoute />} />
            <Route path="properties/:propertyId/requests/new" element={<CreateRequestsRoute />} />
            <Route path="rental-applications" element={<RentalApplicationsRoute />} />
            <Route path="maintenance-requests" element={<MaintenanceRequestsRoute />} />
            <Route path="payment-history" element={<PaymentHistoryRoute />} />
            <Route path="payment/success" element={<PaymentSuccessRoute />} />
            <Route path="payment/cancel" element={<PaymentCancelRoute />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppContext.Provider>
  );
}

function App() {
  return <AppRoutes />;
}

export default App;
