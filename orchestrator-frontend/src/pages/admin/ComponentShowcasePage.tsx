/**
 * ComponentShowcasePage — Design system reference for the admin portal.
 *
 * Add new components here as they are created.
 * Route: /admin/components (superadmin / dev only, not in production nav)
 */

import { useState } from 'react';
import { RoleSelector } from '@/components/ui/RoleSelector';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="border-b border-[var(--color-border-default)] pb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo data
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_ROLE_OPTIONS = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ROLE_ADMIN',       label: 'Admin' },
  { value: 'ROLE_ACCOUNTING',  label: 'Accounting' },
  { value: 'ROLE_FACTORY',     label: 'Factory' },
  { value: 'ROLE_SALES',       label: 'Sales' },
  { value: 'ROLE_DEALER',      label: 'Dealer' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function ComponentShowcasePage() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['ROLE_ADMIN']);
  const [selectedRolesFiltered, setSelectedRolesFiltered] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('one');

  return (
    <div className="space-y-12 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
          Component Showcase
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Design system reference. Not linked in production navigation.
        </p>
      </div>

      {/* ── RoleSelector ─────────────────────────────────────────────────── */}
      <Section title="RoleSelector">
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Replaces the generic MultiSelect for role assignment. Shows role key, display name, and a
          one-line description. ROLE_SUPER_ADMIN is warning-tinted.
        </p>
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-2">
              All roles visible (including SUPER_ADMIN)
            </p>
            <RoleSelector
              label="Roles"
              options={DEMO_ROLE_OPTIONS}
              value={selectedRoles}
              onChange={setSelectedRoles}
            />
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
              Selected: {selectedRoles.length > 0 ? selectedRoles.join(', ') : 'none'}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-2">
              ROLE_SUPER_ADMIN hidden (hideSuperAdmin)
            </p>
            <RoleSelector
              label="Roles"
              options={DEMO_ROLE_OPTIONS.filter((o) => o.value !== 'ROLE_SUPER_ADMIN')}
              value={selectedRolesFiltered}
              onChange={setSelectedRolesFiltered}
            />
          </div>

          <div>
            <p className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-2">
              Disabled state
            </p>
            <RoleSelector
              label="Roles"
              options={DEMO_ROLE_OPTIONS}
              value={['ROLE_ADMIN']}
              onChange={() => {}}
              disabled
            />
          </div>
        </div>
      </Section>

      {/* ── Badge ────────────────────────────────────────────────────────── */}
      <Section title="Badge">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="success" dot>Active</Badge>
          <Badge variant="warning" dot>Pending</Badge>
          <Badge variant="danger" dot>Failed</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Section>

      {/* ── Button ───────────────────────────────────────────────────────── */}
      <Section title="Button">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm">Primary</Button>
          <Button variant="secondary" size="sm">Secondary</Button>
          <Button variant="ghost" size="sm">Ghost</Button>
          <Button variant="danger" size="sm">Danger</Button>
          <Button variant="primary" size="sm" isLoading>Loading</Button>
          <Button variant="primary" size="sm" disabled>Disabled</Button>
        </div>
      </Section>

      {/* ── StatCard ─────────────────────────────────────────────────────── */}
      <Section title="StatCard">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Users" value="1,248" change={{ value: 8.1, label: 'vs last month' }} />
          <StatCard label="Pending Approvals" value="14" change={{ value: -4.2, label: 'vs last month' }} />
        </div>
      </Section>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <Section title="Tabs">
        <div className="space-y-4">
          <Tabs
            tabs={[{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }]}
            active={activeTab}
            onChange={setActiveTab}
            variant="pill"
            size="sm"
          />
          <Tabs
            tabs={[{ label: 'One', value: 'one' }, { label: 'Two', value: 'two' }, { label: 'Three', value: 'three' }]}
            active={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>
      </Section>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <Section title="Input">
        <div className="space-y-3 max-w-xs">
          <Input label="Default" placeholder="Enter value…" />
          <Input label="With error" placeholder="Enter value…" error="This field is required." />
          <Input label="Disabled" placeholder="Enter value…" disabled />
        </div>
      </Section>

      {/* ── EmptyState ───────────────────────────────────────────────────── */}
      <Section title="EmptyState">
        <EmptyState
          title="No results found"
          description="Try adjusting your search or filters to find what you're looking for."
        />
      </Section>
    </div>
  );
}
