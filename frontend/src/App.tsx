import { useState, useEffect, useCallback } from 'react';
import { getUserFromToken } from './utils/auth';
import type { Role, Crumb, ProfileDataProps } from './utils/props';
import { authFetch } from './utils/api';

import '../src/App.css';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import Properties from './pages/Properties';
import ViewDetails from './pages/ViewDetails';
import PropertyForm from './pages/PropertyForm';
import TerminateLease from './pages/TerminateLease';
import ViewProfile from './pages/ViewProfile';
import UpdateProfile from './pages/UpdateProfile';
import ApplyRental from './pages/ApplyRental';
import RentalApplications from './pages/RentalApplications';
import CreateRequests from './pages/CreateRequests';
import MaintenanceRequests from './pages/MaintenanceRequests';
import PaymentHistory from './pages/PaymentHistory';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

type NavItem = {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

function NavCrumb({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="breadcrumb" className="mx-auto w-full max-w-6xl px-4 pt-6 font-[family-name:var(--font-body)] sm:px-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;

          return (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <i className="fa-solid fa-chevron-right text-[10px] text-gray-400" />}

              {crumb.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="cursor-pointer font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)] hover:underline"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={isLast ? 'font-semibold text-[var(--text)]' : 'text-gray-500'}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function App() {
  const [userRole, setUserRole] = useState<Role>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileDataProps | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');

    if (payment === 'success') return 'paymentSuccess';
    if (payment === 'cancel') return 'paymentCancel';
    return 'home';
  });
  const [previousView, setPreviousView] = useState('home');
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const propertyLabel = userRole === 'landlord' ? 'My Properties' : 'My Rentals';
  const propertyView  = userRole === 'landlord' ? 'myProperties'  : 'myRentals';

  const navigateTo = (id: string) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setIsNavOpen(false);
  };

  const requireAuth = () => {
    if (!userId || !userRole) {
      setCurrentView('auth');
      return false;
    }
    return true;
  };

  const handleLogout = useCallback(async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    setUserRole(null);
    setUserId(null);
    setCurrentView('home');
    setPreviousView('home');
  }, []);

  const getBreadcrumbs = (): Crumb[] => {
    const home: Crumb = { 
      label: 'Home', 
      onClick: () => setCurrentView('home') 
    };
    const propertyParent: Crumb = {
      label: propertyLabel,
      onClick: () => { setSelectedProperty(null); setCurrentView(propertyView); }
    };
    const viewDetailsCrumb: Crumb = {
      label: 'View Details',
      onClick: () => setCurrentView('viewDetails')
    };
    const maintenanceCrumb: Crumb = {
      label: 'Maintenance Requests',
      onClick: () => { setSelectedProperty(null); setCurrentView('maintenanceRequests'); }
    };
    const rentalAppCrumb: Crumb = {
      label: 'Rental Applications',
      onClick: () => { setSelectedProperty(null); setCurrentView('rentalApplications'); }
    };

    switch (currentView) {
      case 'auth': return [home, { label: 'Log In / Sign Up' }];
      case 'forgotPassword': return [home, { label: 'Log In / Sign Up', onClick: () => setCurrentView('auth') }, { label: 'Reset Password' }];
      case 'viewProfile': return [home, { label: 'View Profile' }];
      case 'updateProfile': return [home, { label: 'View Profile', onClick: () => setCurrentView('viewProfile') }, { label: 'Update Profile' }];
      case 'myProperties':
      case 'myRentals': return [home, { label: propertyLabel }];

      case 'addProperty' : return [home, propertyParent, { label: 'Add New Property' }];
      case 'updateProperty': return [home, propertyParent, { label: 'Update Property' }];

      case 'viewDetails': {
        const fromProperty = previousView === 'myProperties' || previousView === 'myRentals';
        return [home, ...(fromProperty ? [propertyParent] : []), { label: 'View Details' }];
      }
      case 'terminateLease': return [home, propertyParent, { label: 'Terminate Lease' }];

      case 'applyRental': {
        const fromProperty = previousView === 'myProperties' || previousView === 'myRentals';
        const fromRentalApps = previousView === 'rentalApplications';
        const fromViewDetails = previousView === 'viewDetails';
        return [
          home,
          ...(fromProperty ? [propertyParent] : []),
          ...(fromRentalApps ? [rentalAppCrumb] : []),
          ...(fromViewDetails ? [viewDetailsCrumb] : []),
          { label: 'Apply for Rental' }
        ];
      }

      case 'rentalApplications': return [home, { label: 'Rental Applications' }];
      case 'createRequests': {
        const fromProperty = previousView === 'myProperties' || previousView === 'myRentals';
        const fromMaintenance = previousView === 'maintenanceRequests';
        const fromViewDetails = previousView === 'viewDetails';

        return [
          home,
          ...(fromProperty ? [propertyParent] : []),
          ...(fromMaintenance ? [maintenanceCrumb] : []),
          ...(fromViewDetails ? [viewDetailsCrumb] : []),
          { label: 'Create Request' }
        ];
      }

      case 'maintenanceRequests': return [home, { label: 'Maintenance Requests' }];
      case 'paymentHistory': return [home, { label: 'Payment History' }];
      case 'paymentSuccess': return [home, { label: 'Payment Success' }];
      case 'paymentCancel': return [home, { label: 'Payment Cancelled' }];

      default: return [];
    }
  };

  const renderMainContent = () => {
    const crumbs = <NavCrumb crumbs={getBreadcrumbs()} />;

    switch (currentView) {
      case 'auth':
        return (
          <>
            {crumbs}
            <Auth
              goBack ={() => setCurrentView('home')}
              setUserId={setUserId} 
              setUserRole={(role) => {
                setUserRole(role);
                selectedProperty ? setCurrentView('viewDetails') : setCurrentView('home');
              }}
              onForgotPassword={() => setCurrentView('forgotPassword')}
            />
          </>
        );

      case 'forgotPassword':
        return (
            <>
                {crumbs}
                <UpdateProfile
                    goBack={() => setCurrentView('auth')}
                    userId={userId || 0}
                    userRole={userRole}
                    restrictToCredentials={true}
                    onSuccess={() => setCurrentView('auth')}
                />
            </>
        );

      case 'viewProfile':
        if (!requireAuth()) return null;   

        return (
          <>
            {crumbs}
            <ViewProfile
              goBack={() => setCurrentView('home')}
              userId={userId || 0}
              userRole={userRole} 
              onUpdateProfile={() => { 
                setPreviousView(currentView);
                setCurrentView('updateProfile');
              }}
            />
          </>
        );

      case 'updateProfile':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <UpdateProfile
              goBack={() => previousView === 'viewProfile' ? setCurrentView(previousView) : setCurrentView('home')}
              userId={userId || 0}
              userRole={userRole}
              restrictToCredentials={previousView === 'auth'}
              onSuccess={() => setCurrentView('viewProfile')}
            />
          </>
        );
      
      case 'myProperties':
      case 'myRentals':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <Properties
              goBack={() => setCurrentView('home')}
              userId={userId || 0} 
              userRole={userRole} 
              setUserId={setUserId} 
              setUserRole={setUserRole}
              onViewDetails={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('viewDetails');
              }}
              onCreateRequest={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('createRequests');
              }}
              onUpdateProperty={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('updateProperty');
              }}
              onViewPayment={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('paymentHistory');
              }}
              onTerminateLease={(prop) => {
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('terminateLease');
              }}
            />
          </>
        );
      
      case 'viewDetails':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <ViewDetails
              goBack={() => {
                setSelectedProperty(null);

                previousView === 'home'
                  ? navigateTo('marketplaceContainer')
                  : previousView === 'myProperties' ||
                    previousView === 'myRentals' ||
                    previousView === 'rentalApplications' ||
                    previousView === 'maintenanceRequests' ||
                    previousView === 'paymentHistory'
                    ? setCurrentView(previousView) : setCurrentView('home');
              }}

              userRole={userRole}
              userId={userId || 0}
              property={selectedProperty}
              onViewApplyRental={() => { 
                setSelectedProperty(selectedProperty); 
                setCurrentView('applyRental'); 
              }}
              onViewRentalApplications={() => setCurrentView('rentalApplications')}
              onTerminateLease={() => setCurrentView('terminateLease')}
            />
          </>
        );
      
      case 'terminateLease':
        if (!requireAuth()) return null;
        
        return (
            <>
                {crumbs}
                <TerminateLease
                    property={selectedProperty}
                    userId={userId || 0}
                    userRole={userRole}
                    onSuccess={() => {
                        setSelectedProperty(null);
                        setCurrentView(propertyView);
                    }}
                    onCancel={() => setCurrentView(previousView)}
                />
            </>
        );

      case 'addProperty':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <PropertyForm
              mode='add'
              goBack={() => setCurrentView('myProperties')}
              userId={userId || 0}
            />
          </>
        );

      case 'updateProperty':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <PropertyForm
              mode='update'
              goBack={() => setCurrentView('myProperties')}
              property={selectedProperty}
              onSuccess={() => {
                setSelectedProperty(null);
                setCurrentView('myProperties');
              }}
            />
          </>
        );
      
      case 'applyRental':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <ApplyRental
              property={selectedProperty}
              userId={userId || 0}
              userRole={userRole}
              onSuccess={() => setCurrentView('rentalApplications')}
              onCancel={() => {
                setSelectedProperty(null);

                previousView === 'home' 
                ? navigateTo('marketplaceContainer') : previousView === 'myProperties' || previousView === 'myRentals' 
                  ? setCurrentView(propertyView) : previousView === 'viewDetails'
                    ? setCurrentView('viewDetails') : setCurrentView('home');
              }}
            />
          </>
        );

      case 'rentalApplications':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <RentalApplications
              goBack={() => setCurrentView('home')}
              userId={userId || 0} 
              userRole={userRole}
              onViewDetails={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('viewDetails');
              }}
            />
          </>
        );

      case 'createRequests':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <CreateRequests
              property={selectedProperty}
              userId={userId || 0}
              userRole={userRole}
              onSuccess={() => setCurrentView('maintenanceRequests')}
              onCancel={() => {
                previousView === 'myProperties' || previousView === 'myRentals'
                  ? setCurrentView(propertyView) : previousView === 'viewDetails'
                    ? setCurrentView('viewDetails') : setCurrentView('home');
              }}
            />
          </>
        );
      
      case 'maintenanceRequests':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <MaintenanceRequests
              goBack={() => setCurrentView('home')}
              userId={userId || 0}
              userRole={userRole}
              onViewDetails={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('viewDetails');
              }}
            />
          </>
        );
      
      case 'paymentHistory':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <PaymentHistory
              goBack={() => setCurrentView('home')}
              userId={userId || 0}
              userRole={userRole}
              onViewDetails={(prop) => { 
                setSelectedProperty(prop);
                setPreviousView(currentView);
                setCurrentView('viewDetails');
              }}
            />
          </>
        );

      case 'paymentSuccess':
        if (!requireAuth()) return null;

        return (
          <>
            {crumbs}
            <PaymentSuccess 
              goBack={() => {
                window.history.replaceState({}, '', '/');
                setCurrentView('paymentHistory');
              }}
            />
          </>
        );

      case 'paymentCancel':
        if (!requireAuth()) return null;
        
        return (
          <>
            {crumbs}
            <PaymentCancel
              goBack={() => {
                window.history.replaceState({}, '', '/');
                setCurrentView('paymentHistory');
              }}
            />
          </>
        );

      default:
        return (
          <>
            <section id='homeSection' className="mx-auto w-full max-w-6xl px-4 pt-8 font-[family-name:var(--font-body)] text-[var(--text)] sm:px-6">
              <header className="relative overflow-hidden rounded-2xl bg-[url('/Background.png')] bg-cover bg-center">
                <div className="absolute inset-0 bg-black/50" />

                <div className="relative flex flex-col items-center gap-5 px-6 py-16 text-center sm:px-10 sm:py-24">
                  <div className="flex flex-col gap-2">
                    <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-white sm:text-5xl">FoRent</h1>
                    <h2 className="max-w-2xl text-base text-orange-50 sm:text-lg">Unlock The Door to Better Living</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo('marketplaceContainer')}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-transparent hover:text-white"
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
              onViewApplyRental={(prop) => {
                setSelectedProperty(prop);
                setPreviousView('home');
                setCurrentView('applyRental');
              }}
              onViewDetails={(prop) => {
                setSelectedProperty(prop);
                setPreviousView('home');
                setCurrentView('viewDetails');
              }}
              onViewRentalApplications={() => setCurrentView('rentalApplications')}
            />
          </>
        );
    }
  }

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId || !userRole) return;
      const endpoint = userRole === 'landlord' ? `/api/landlords` : `/api/tenants`;

      try {
        const response = await authFetch(`${import.meta.env.VITE_API_URL}${endpoint}/${userId}`);
        if (!response.ok) return;

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    fetchProfile();
  }, [userId, userRole]);

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
    window.addEventListener('unauthorized', handleLogout);
    return () => window.removeEventListener('unauthorized', handleLogout);
  }, [handleLogout]);

  const isPropertyView = currentView === 'myProperties' || currentView === 'myRentals';

  const navItems: NavItem[] = userRole ? [
    {
      icon: 'fa-home',
      label: 'Home',
      active: currentView === 'home',
      onClick: () => { navigateTo('homeSection'); setIsNavOpen(false); },
    },
    {
      icon: 'fa-user',
      label: 'View Profile',
      active: currentView === 'viewProfile',
      onClick: () => handleNavClick('viewProfile'),
    },
    {
      icon: 'fa-user-pen',
      label: 'Update Profile',
      active: currentView === 'updateProfile',
      onClick: () => handleNavClick('updateProfile'),
    },
    ...(userRole === 'landlord' ? [
      {
        icon: 'fa-tree-city',
        label: 'My Properties',
        active: isPropertyView,
        onClick: () => handleNavClick('myProperties'),
      },
      {
        icon: 'fa-plus',
        label: 'Add New Property',
        active: currentView === 'addProperty',
        onClick: () => handleNavClick('addProperty'),
      },
    ] : []),
    ...(userRole === 'tenant' ? [
      {
        icon: 'fa-house-user',
        label: 'My Rentals',
        active: isPropertyView,
        onClick: () => handleNavClick('myRentals'),
      },
    ] : []),
    {
      icon: 'fa-file-circle-check',
      label: 'Rental Applications',
      active: currentView === 'rentalApplications',
      onClick: () => handleNavClick('rentalApplications'),
    },
    {
      icon: 'fa-screwdriver-wrench',
      label: 'Maintenance Requests',
      active: currentView === 'maintenanceRequests',
      onClick: () => handleNavClick('maintenanceRequests'),
    },
    {
      icon: 'fa-credit-card',
      label: 'Payment History',
      active: currentView === 'paymentHistory',
      onClick: () => handleNavClick('paymentHistory'),
    },
  ] : [];

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-body)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-orange-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {userRole && (
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsNavOpen(true)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-[var(--primary-soft)]"
              >
                <i className="fa-solid fa-bars" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="flex cursor-pointer items-center gap-1.5"
            >
              <img src="/Logo.png" alt="FoRent logo" className="h-6 w-6 object-contain" />
              <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--primary-dark)]">FoRent</span>
            </button>
          </div>

          {userRole ? (
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-gray-500">Welcome,</span>
              <span className="font-semibold text-[var(--text)]">{fullName || 'User'}</span>
            </div>
          ) : (
            currentView !== 'auth' && currentView !== 'forgotPassword' && (
              <button
                type="button"
                onClick={() => setCurrentView('auth')}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
              >
                <i className="fa-solid fa-right-to-bracket" />
                Log In / Sign Up
              </button>
            )
          )}
        </div>
      </header>

      {userRole && (
        <>
          <div
            onClick={() => setIsNavOpen(false)}
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />

          <aside
            inert={!isNavOpen}
            className={`fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="relative overflow-hidden bg-[url('/Background.png')] bg-cover bg-center">
              <div className="absolute inset-0 bg-orange-600/70" />

              <div className="relative flex items-start justify-between gap-3 px-5 py-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <img src="/Logo.png" alt="FoRent logo" className="h-9 w-9 rounded-lg bg-white/90 object-contain p-1" />
                    <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-white">FoRent</h2>
                  </div>

                  <div className="flex flex-col text-sm text-orange-50">
                    <span>Welcome,</span>
                    <span className="font-semibold text-white">{fullName || 'User'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsNavOpen(false)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-[var(--primary)] hover:text-white"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
              {navItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${item.active
                    ? 'bg-[var(--primary-soft)] text-[var(--primary-dark)]'
                    : 'text-gray-700 hover:bg-[var(--primary-soft)] hover:text-[var(--primary-dark)]'}`}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center`} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="border-t border-orange-100 p-3">
              <button
                type="button"
                onClick={() => { handleLogout(); setIsNavOpen(false); }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-red-500 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}

      <main className="flex w-full flex-col">
        {authLoading
          ? <p className="py-12 text-center text-sm text-gray-500">Loading...</p>
          : renderMainContent()
        }
      </main>
    </div>
  )
}

export default App