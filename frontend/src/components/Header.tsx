import type { Role } from '../utils/props';

interface HeaderProps {
  userRole: Role;
  fullName: string;
  currentView: string;
  onOpenNav: () => void;
  onHome: () => void;
  onLogin: () => void;
}

function Header({ userRole, fullName, currentView, onOpenNav, onHome, onLogin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-orange-100 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {userRole && (
            <button
              type="button"
              aria-label="Open menu"
              onClick={onOpenNav}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[var(--primary)] text-white transition-colors hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
            >
              <i className="fa-solid fa-bars" />
            </button>
          )}

          <button
            type="button"
            onClick={onHome}
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
          currentView !== '/auth' && currentView !== '/forgot-password' && (
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-dark)]"
            >
              <i className="fa-solid fa-right-to-bracket" />
              Log In / Sign Up
            </button>
          )
        )}
      </div>
    </header>
  );
}

export default Header;
