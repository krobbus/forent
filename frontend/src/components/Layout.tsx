import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { Role } from '../utils/props';
import Header from './Header';

export type NavItem = {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
};

interface LayoutProps {
  userRole: Role;
  fullName: string;
  onLogout: () => void;
}

function Layout({ userRole, fullName, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const currentView = location.pathname;
  const isPropertyView = currentView === '/my-properties' || currentView === '/my-rentals';
  const propertyPath = userRole === 'landlord' ? '/my-properties' : '/my-rentals';
  const navItems: NavItem[] = userRole ? [
    { icon: 'fa-home', label: 'Home', active: currentView === '/', onClick: () => navigate('/') },
    { icon: 'fa-user', label: 'View Profile', active: currentView === '/profile', onClick: () => navigate('/profile') },
    { icon: 'fa-user-pen', label: 'Update Profile', active: currentView === '/profile/edit', onClick: () => navigate('/profile/edit') },
    ...(userRole === 'landlord'
      ? [
        { icon: 'fa-tree-city', label: 'My Properties', active: isPropertyView, onClick: () => navigate(propertyPath) },
        { icon: 'fa-plus', label: 'Add New Property', active: currentView === '/properties/new', onClick: () => navigate('/properties/new') },
      ]
      : [{ icon: 'fa-house-user', label: 'My Rentals', active: isPropertyView, onClick: () => navigate(propertyPath) }]),
    { icon: 'fa-file-circle-check', label: 'Rental Applications', active: currentView === '/rental-applications', onClick: () => navigate('/rental-applications') },
    { icon: 'fa-screwdriver-wrench', label: 'Maintenance Requests', active: currentView === '/maintenance-requests', onClick: () => navigate('/maintenance-requests') },
    { icon: 'fa-credit-card', label: 'Payment History', active: currentView === '/payment-history', onClick: () => navigate('/payment-history') },
  ] : [];

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-body)] text-[var(--text)]">
      <Header
        userRole={userRole}
        fullName={fullName}
        currentView={currentView}
        onOpenNav={() => setIsNavOpen(true)}
        onHome={() => navigate('/')}
        onLogin={() => navigate('/auth')}
      />

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
                onClick={() => {
                  onLogout();
                  setIsNavOpen(false);
                }}
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
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
