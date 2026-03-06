/**
 * DealerProfilePage — My Profile
 *
 * Dealer self-service profile page. Allows the dealer to:
 *  - View their account information (name, email, dealer code)
 *  - Change their password via /profile (shared auth profile page)
 *
 * Note: Full profile editing is handled by the shared /profile route.
 * This page provides a portal-specific entry point with a link to the shared profile.
 */

import { useNavigate } from 'react-router-dom';
import { User, KeyRound, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function DealerProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          Account
        </p>
        <h1 className="mt-0.5 text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">
          My Profile
        </h1>
      </div>

      {/* ── Account Details ─────────────────────────────────────────── */}
      <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
            <User size={16} className="text-[var(--color-text-tertiary)]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {user?.displayName ?? '—'}
            </p>
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              {user?.email ?? '—'}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
              Role
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--color-text-primary)]">
              {user?.roles[0] ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl hover:border-[var(--color-border-strong)] transition-colors group"
        >
          <div className="flex items-center gap-3">
            <KeyRound size={16} className="text-[var(--color-text-tertiary)]" />
            <div className="text-left">
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                Edit Profile &amp; Change Password
              </p>
              <p className="text-[12px] text-[var(--color-text-tertiary)]">
                Update your name, email, or password
              </p>
            </div>
          </div>
          <ArrowRight
            size={14}
            className="text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </button>
      </div>
    </div>
  );
}
