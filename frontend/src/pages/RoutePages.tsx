import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import Auth from './Auth';
import ApplyRental from './ApplyRental';
import CreateRequests from './CreateRequests';
import MaintenanceRequests from './MaintenanceRequests';
import Marketplace from './Marketplace';
import PaymentCancel from './PaymentCancel';
import PaymentHistory from './PaymentHistory';
import PaymentSuccess from './PaymentSuccess';
import Properties from './Properties';
import PropertyForm from './PropertyForm';
import RentalApplications from './RentalApplications';
import TerminateLease from './TerminateLease';
import UpdateProfile from './UpdateProfile';
import ViewDetails from './ViewDetails';
import ViewProfile from './ViewProfile';
import type { PropertyDataProps } from '../utils/props';
import { useAppContext } from '../utils/appContext';

type RouteState = { from?: string; parent?: string };

const homeCrumb = { label: 'Home', to: '/' };

function routeFrom(locationState: unknown, fallback: string) {
  return (locationState as RouteState | null)?.from || fallback;
}

function routeParent(locationState: unknown) {
  const state = locationState as RouteState | null;
  return state?.parent || (state?.from === '/my-properties' || state?.from === '/my-rentals' ? state.from : undefined);
}

function useProperty() {
  const { propertyId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; property: PropertyDataProps | null }>({
    id: '',
    property: null,
  });

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;

    fetch(`${import.meta.env.VITE_API_URL}/api/properties/${propertyId}`)
      .then(response => {
        if (!response.ok) throw new Error(`Property request failed with status ${response.status}`);
        return response.json() as Promise<PropertyDataProps>;
      })
      .then(property => {
        if (!cancelled) setResult({ id: propertyId, property });
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Error fetching property:', error);
          setResult({ id: propertyId, property: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return {
    property: result.id === propertyId ? result.property : null,
    loading: result.id !== propertyId,
  };
}

function PropertyBreadcrumbs({
  property,
  parent,
  current,
}: {
  property: PropertyDataProps;
  parent?: string;
  current?: string;
}) {
  return (
    <Breadcrumbs
      items={[
        homeCrumb,
        ...(parent ? [{ label: parent === '/my-properties' ? 'My Properties' : 'My Rentals', to: parent }] : []),
        { label: property.property_name, to: current ? `/properties/${property.id}` : undefined },
        ...(current ? [{ label: current }] : []),
      ]}
    />
  );
}

function HomeRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole } = useAppContext();

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  const navigateToMarketplace = () => {
    document.getElementById('marketplaceContainer')?.scrollIntoView({ behavior: 'smooth' });
  };
  const navigateToProperty = (path: string) => (property: PropertyDataProps) => {
    navigate(`/properties/${property.id}${path}`, { state: { from: location.pathname, parent: routeParent(location.state) } });
  };

  return (
    <>
      <section id="homeSection" className="mx-auto w-full max-w-6xl px-4 pt-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
        <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-bottom">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative flex flex-col items-center gap-5 px-6 py-16 text-center sm:px-10 sm:py-24">
            <div className="flex flex-col gap-2">
              <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--primary)] sm:text-5xl">FoRent</h1>
              <h2 className="max-w-2xl text-base text-orange-50 sm:text-lg">Unlock The Door to Better Living</h2>
            </div>
            <button
              type="button"
              onClick={navigateToMarketplace}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 py-2.5 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-transparent hover:text-white"
            >
              <i className="fa-solid fa-magnifying-glass" />
              See Available Properties
            </button>
          </div>
        </header>
      </section>
      <Marketplace
        userId={userId || 0}
        userRole={userRole}
        onViewApplyRental={navigateToProperty('/apply')}
        onViewDetails={navigateToProperty('')}
        onViewRentalApplications={() => navigate('/rental-applications')}
        onUpdateProperty={navigateToProperty('/edit')}
      />
    </>
  );
}

export function PaymentReturnRoute() {
  const [searchParams] = useSearchParams();
  const payment = searchParams.get('payment');
  if (payment !== 'success' && payment !== 'cancel') return <HomeRoute />;
  const query = searchParams.toString();
  return <Navigate to={`/payment/${payment}${query ? `?${query}` : ''}`} replace />;
}

export function AuthRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserId, setUserRole } = useAppContext();
  const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string; state?: unknown } } | null)?.from;
  const returnTo = from ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}` : '/';

  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Log In / Sign Up' }]} />
      <Auth
        goBack={() => navigate('/')}
        setUserId={setUserId}
        setUserRole={role => {
          setUserRole(role);
          navigate(returnTo, { replace: true, state: from?.state });
        }}
        onForgotPassword={() => navigate('/forgot-password')}
      />
    </>
  );
}

export function ForgotPasswordRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Log In / Sign Up', to: '/auth' }, { label: 'Reset Password' }]} />
      <UpdateProfile
        goBack={() => navigate('/auth')}
        userId={0}
        userRole={null}
        restrictToCredentials
        onSuccess={() => navigate('/auth')}
      />
    </>
  );
}

export function ProfileRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'View Profile' }]} />
      <ViewProfile
        goBack={() => navigate('/')}
        userId={userId || 0}
        userRole={userRole}
        onUpdateProfile={() => navigate('/profile/edit')}
      />
    </>
  );
}

export function EditProfileRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'View Profile', to: '/profile' }, { label: 'Update Profile' }]} />
      <UpdateProfile
        goBack={() => navigate('/profile')}
        userId={userId || 0}
        userRole={userRole}
        onSuccess={() => navigate('/profile')}
      />
    </>
  );
}

export function PropertiesRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole, setUserId, setUserRole } = useAppContext();
  const isLandlord = location.pathname === '/my-properties';
  const listPath = isLandlord ? '/my-properties' : '/my-rentals';
  const propertyLabel = isLandlord ? 'My Properties' : 'My Rentals';
  const goToProperty = (suffix: string) => (property: PropertyDataProps) => {
    navigate(`/properties/${property.id}${suffix}`, { state: { from: listPath, parent: listPath } });
  };

  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: propertyLabel }]} />
      <Properties
        goBack={() => navigate('/')}
        userId={userId || 0}
        userRole={userRole}
        setUserId={setUserId}
        setUserRole={setUserRole}
        onViewDetails={goToProperty('')}
        onCreateRequest={goToProperty('/requests/new')}
        onUpdateProperty={goToProperty('/edit')}
        onViewPayment={() => navigate('/payment-history')}
        onTerminateLease={goToProperty('/terminate')}
      />
    </>
  );
}

export function PropertyDetailsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole } = useAppContext();
  const { property, loading } = useProperty();
  const from = routeFrom(location.state, '/');
  const parent = routeParent(location.state);
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading property...</p>;
  if (!property) return <p className="py-12 text-center text-sm text-gray-500">Property not found.</p>;

  const goToPropertyRoute = (suffix: string) => navigate(`/properties/${property.id}${suffix}`, {
    state: { from: location.pathname, parent: routeParent(location.state) },
  });
  const backTo = from === '/' ? '/#marketplaceContainer' : from;

  return (
    <>
      <PropertyBreadcrumbs property={property} parent={parent} />
      <ViewDetails
        goBack={() => navigate(backTo)}
        userRole={userRole}
        userId={userId || 0}
        property={property}
        onViewApplyRental={() => goToPropertyRoute('/apply')}
        onViewRentalApplications={() => navigate('/rental-applications')}
        onTerminateLease={() => goToPropertyRoute('/terminate')}
      />
    </>
  );
}

export function AddPropertyRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  const parentPath = userRole === 'landlord' ? '/my-properties' : '/my-rentals';
  const parentLabel = userRole === 'landlord' ? 'My Properties' : 'My Rentals';
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: parentLabel, to: parentPath }, { label: 'Add New Property' }]} />
      <PropertyForm mode="add" goBack={() => navigate(parentPath)} userId={userId || 0} />
    </>
  );
}

export function UpdatePropertyRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userRole } = useAppContext();
  const { property, loading } = useProperty();
  const from = routeFrom(location.state, userRole === 'landlord' ? '/my-properties' : '/my-rentals');
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading property...</p>;
  if (!property) return <p className="py-12 text-center text-sm text-gray-500">Property not found.</p>;
  const parentPath = from === '/' ? '/#marketplaceContainer' : from;
  const parentLabel = from === '/my-properties' ? 'My Properties' : from === '/my-rentals' ? 'My Rentals' : undefined;

  return (
    <>
      <PropertyBreadcrumbs property={property} parent={parentLabel ? from : routeParent(location.state)} current="Update Property" />
      <PropertyForm
        mode="update"
        property={property}
        goBack={() => navigate(parentPath)}
        onSuccess={() => navigate(userRole === 'landlord' ? '/my-properties' : '/my-rentals')}
      />
    </>
  );
}

export function ApplyRentalRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole } = useAppContext();
  const { property, loading } = useProperty();
  const from = routeFrom(location.state, `/properties/${property?.id}`);
  const parent = routeParent(location.state);
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading property...</p>;
  if (!property) return <p className="py-12 text-center text-sm text-gray-500">Property not found.</p>;
  const backTo = from === '/' ? '/#marketplaceContainer' : from;

  return (
    <>
      <PropertyBreadcrumbs property={property} parent={parent} current="Apply for Rental" />
      <ApplyRental
        property={property}
        userId={userId || 0}
        userRole={userRole}
        onSuccess={() => navigate('/rental-applications')}
        onCancel={() => navigate(backTo)}
      />
    </>
  );
}

export function TerminateLeaseRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole } = useAppContext();
  const { property, loading } = useProperty();
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading property...</p>;
  if (!property) return <p className="py-12 text-center text-sm text-gray-500">Property not found.</p>;
  const parent = routeParent(location.state);
  const from = routeFrom(location.state, `/properties/${property.id}`);

  return (
    <>
      <PropertyBreadcrumbs property={property} parent={parent} current="Terminate Lease" />
      <TerminateLease
        property={property}
        userId={userId || 0}
        userRole={userRole}
        onSuccess={() => navigate(userRole === 'landlord' ? '/my-properties' : '/my-rentals')}
        onCancel={() => navigate(from)}
      />
    </>
  );
}

export function CreateRequestsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userRole } = useAppContext();
  const { property, loading } = useProperty();
  if (loading) return <p className="py-12 text-center text-sm text-gray-500">Loading property...</p>;
  if (!property) return <p className="py-12 text-center text-sm text-gray-500">Property not found.</p>;
  const from = routeFrom(location.state, `/properties/${property.id}`);
  const parent = routeParent(location.state);

  return (
    <>
      <PropertyBreadcrumbs property={property} parent={parent} current="Create Request" />
      <CreateRequests
        property={property}
        userId={userId || 0}
        userRole={userRole}
        onSuccess={() => navigate('/maintenance-requests')}
        onCancel={() => navigate(from)}
      />
    </>
  );
}

export function RentalApplicationsRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  const openProperty = (property: PropertyDataProps) => navigate(`/properties/${property.id}`, { state: { from: '/rental-applications' } });
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Rental Applications' }]} />
      <RentalApplications goBack={() => navigate('/')} userId={userId || 0} userRole={userRole} onViewDetails={openProperty} />
    </>
  );
}

export function MaintenanceRequestsRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  const openProperty = (property: PropertyDataProps) => navigate(`/properties/${property.id}`, { state: { from: '/maintenance-requests' } });
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Maintenance Requests' }]} />
      <MaintenanceRequests goBack={() => navigate('/')} userId={userId || 0} userRole={userRole} onViewDetails={openProperty} />
    </>
  );
}

export function PaymentHistoryRoute() {
  const navigate = useNavigate();
  const { userId, userRole } = useAppContext();
  const openProperty = (property: PropertyDataProps) => navigate(`/properties/${property.id}`, { state: { from: '/payment-history' } });
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Payment History' }]} />
      <PaymentHistory goBack={() => navigate('/')} userId={userId || 0} userRole={userRole} onViewDetails={openProperty} />
    </>
  );
}

export function PaymentSuccessRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Payment Success' }]} />
      <PaymentSuccess goBack={() => navigate('/payment-history')} />
    </>
  );
}

export function PaymentCancelRoute() {
  const navigate = useNavigate();
  return (
    <>
      <Breadcrumbs items={[homeCrumb, { label: 'Payment Cancelled' }]} />
      <PaymentCancel goBack={() => navigate('/payment-history')} />
    </>
  );
}
