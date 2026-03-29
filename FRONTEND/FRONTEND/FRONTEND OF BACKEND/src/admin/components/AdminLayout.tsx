import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../lib/authApi';
import { OrchestratorLogo } from '@/shared/components/ui/OrchestratorLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/approvals', label: 'Approvals' },
  { path: '/users', label: 'Users' },
  { path: '/roles', label: 'Roles' },
  { path: '/companies', label: 'Companies' },
  { path: '/settings', label: 'Settings' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)]">
      {/* Mobile Header */}
      <div className="lg:hidden bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)] px-4 h-13 flex items-center justify-between">
        <OrchestratorLogo size={20} variant="full" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-[224px] bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)] transform transition-transform duration-200 ease-out lg:transform-none ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="px-5 py-5 hidden lg:block border-b border-[var(--color-border-subtle)]">
              <OrchestratorLogo size={22} variant="full" />
              <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mt-1.5">
                Admin
              </p>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center h-9 px-3 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'bg-[var(--color-neutral-900)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-2 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={handleLogout}
                className="flex items-center h-9 px-3 w-full text-left text-[13px] font-medium text-[var(--color-text-tertiary)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
