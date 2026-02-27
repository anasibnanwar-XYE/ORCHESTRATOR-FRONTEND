import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Disclosure, Menu, Transition, Portal } from '@headlessui/react';
import { ArrowPathIcon, ChevronUpIcon, EnvelopeIcon, PlusIcon, ShieldCheckIcon, FunnelIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, TrashIcon, LockClosedIcon, LockOpenIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import {
  listUsers,
  listCompanies,
  createUser,
  suspendUser,
  unsuspendUser,
  deleteUser,
  disableUserMfa,
  updateUser,
  listRoles,
  type UpdateUserRequest,
  type UserDto,
  type CreateUserRequest,
} from '../lib/adminApi';
import { forgotPassword as apiForgotPassword } from '../lib/authApi';
import { CORE_PORTAL_ROLE_OPTIONS } from '../types/portal-routing';
import { ResponsiveContainer, ResponsiveTable, ResponsiveModal, ResponsiveButton, PageHeader } from '../design-system';

interface DirectoryUser {
  id: number;
  publicId: string;
  displayName: string;
  email: string;
  enabled: boolean;
  mfaEnabled: boolean;
  roles: string[];
  companies: string[];
}

interface CompanyOption {
  id: number;
  code: string;
  name: string;
}

interface RoleOption {
  name: string;
  description?: string;
}

interface CreateUserForm {
  displayName: string;
  email: string;
  roles: string[];
  companyIds: number[];
}

const initialCreateForm: CreateUserForm = {
  displayName: '',
  email: '',
  roles: [],
  companyIds: [],
};

interface UserActionsMenuProps {
  user: DirectoryUser;
  onViewDetails: (user: DirectoryUser) => void;
  onSuspendUser: (userId: number, currentStatus: boolean, userName: string) => void;
  onDisableMfa: (userId: number, userName: string) => void;
  onPasswordReset: (email: string, userName: string) => void;
  onDeleteUser: (userId: number, userName: string) => void;
}

const formatRoleName = (role: string): string => {
  const map: Record<string, string> = {
    'ROLE_ADMIN': 'Administrator',
    'ROLE_USER': 'User',
    'ROLE_MANAGER': 'Manager',
    'admin': 'Administrator',
    'user': 'User',
    'super_admin': 'Super Admin'
  };

  if (map[role]) return map[role];

  return role
    .replace(/^ROLE_/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

interface UserTableProps {
  users: DirectoryUser[];
  loading: boolean;
  onViewDetails: (user: DirectoryUser) => void;
  onSuspendUser: (userId: number, currentStatus: boolean, userName: string) => void;
  onDisableMfa: (userId: number, userName: string) => void;
  onPasswordReset: (email: string, userName: string) => void;
  onDeleteUser: (userId: number, userName: string) => void;
}

function UserTable({
  users,
  loading,
  onViewDetails,
  onSuspendUser,
  onDisableMfa,
  onPasswordReset,
  onDeleteUser
}: UserTableProps) {
  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: DirectoryUser) => (
        <div className="flex items-center">
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-surface-highlight flex items-center justify-center text-xs font-medium text-secondary">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-2 sm:ml-3 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{user.displayName}</p>
            <p className="text-xs text-secondary truncate">{user.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: DirectoryUser) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {user.roles.map(r => (
            <span key={r} className="inline-flex items-center rounded-full border border-border bg-surface-highlight px-2 py-0.5 text-xs font-medium text-primary truncate max-w-full">
              {formatRoleName(r)}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'companies',
      header: 'Companies',
      render: (user: DirectoryUser) => (
        <div className="truncate max-w-xs" title={user.companies.length > 0 ? user.companies.join(', ') : 'None'}>
          {user.companies.length > 0 ? user.companies.join(', ') : <span className="text-tertiary italic">None</span>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: DirectoryUser) => (
        <span className={clsx(
          'inline-flex rounded-full px-2 text-xs font-semibold leading-5',
          user.enabled ? 'bg-status-success-bg text-status-success-text' : 'bg-status-error-bg text-status-error-text'
        )}>
          {user.enabled ? 'Active' : 'Suspended'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: DirectoryUser) => (
        <div className="flex justify-end sm:justify-start">
           <UserActionsMenu
            user={user}
            onViewDetails={onViewDetails}
            onSuspendUser={onSuspendUser}
            onDisableMfa={onDisableMfa}
            onPasswordReset={onPasswordReset}
            onDeleteUser={onDeleteUser}
          />
        </div>
      )
    }
  ];

  if (loading) return <div className="p-8 text-center text-secondary">Loading...</div>;

  return (
    <ResponsiveTable
      data={users}
      columns={columns}
      keyExtractor={(u) => u.id}
      emptyMessage="No users found."
      onRowClick={(u) => onViewDetails(u)}
    />
  );
}

function GroupedUserList({
  users,
  allRoles,
  loading,
  ...tableProps
}: UserTableProps & { allRoles: RoleOption[] }) {
  const uniqueUserRoles = Array.from(new Set(users.flatMap(u => u.roles)));
  const knownRoleNames = new Set(allRoles.map(r => r.name));
  const extraRoles = uniqueUserRoles.filter(r => !knownRoleNames.has(r)).map(r => ({ name: r, description: '' }));

  const displayRoles = [...allRoles, ...extraRoles];

  if (loading) return <div className="p-8 text-center text-secondary">Loading roles...</div>;

  return (
    <div className="space-y-4">
      {displayRoles.map(role => {
        const roleUsers = users.filter(u => u.roles.includes(role.name));
        return (
          <Disclosure key={role.name} defaultOpen={roleUsers.length > 0} as="div" className="overflow-hidden rounded-lg border border-border bg-background">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-left bg-surface hover:bg-surface-highlight transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-base text-primary">{formatRoleName(role.name)}</span>
                    <span className="rounded-full bg-surface-highlight px-2.5 py-0.5 text-xs font-medium text-secondary">
                      {roleUsers.length}
                    </span>
                  </div>
                  <ChevronUpIcon className={clsx('h-5 w-5 text-tertiary transition-transform', !open && 'rotate-180')} />
                </Disclosure.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Disclosure.Panel className="border-t border-border">
                    <div className="p-0 sm:p-0">
                      <UserTable users={roleUsers} loading={false} {...tableProps} />
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        );
      })}
      {displayRoles.length === 0 && (
        <div className="text-center py-10 text-secondary">No roles found.</div>
      )}
    </div>
  );
}

function UserActionsMenu({ user, onViewDetails, onSuspendUser, onDisableMfa, onPasswordReset, onDeleteUser }: UserActionsMenuProps) {
  const [menuPosition, setMenuPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 220; // Approx max height
      const wWidth = 192; // w-48 is 12rem = 192px

      // Default: Open Down
      let position: { top?: number; bottom?: number; left: number } = {
        top: rect.bottom + 4, // mb-1 equivalent
        left: rect.right - wWidth
      };

      // If tight space below, Open Up
      if (spaceBelow < menuHeight) {
        position = {
          bottom: window.innerHeight - rect.top + 4,
          left: rect.right - wWidth
        };
      }

      // Ensure left doesn't go negative
      if (position.left < 10) position.left = rect.left;

      setMenuPosition(position);
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            ref={buttonRef}
            className="inline-flex items-center rounded-md p-1.5 text-tertiary hover:bg-surface-highlight hover:text-secondary"
            onClick={(e) => {
              e.stopPropagation();
              if (!open) calculatePosition();
            }}
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </Menu.Button>
          {open && menuPosition && (
            <Portal>
              <Menu.Items
                static
                className="fixed z-[9999] w-48 rounded-md bg-background shadow-lg ring-1 ring-border focus:outline-none"
                style={{
                  top: menuPosition.top,
                  bottom: menuPosition.bottom,
                  left: menuPosition.left,
                }}
              >
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails(user);
                        }}
                        className={clsx(
                          active ? 'bg-surface-highlight' : '',
                          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary'
                        )}
                      >
                        View Details
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuspendUser(user.id, user.enabled, user.displayName);
                        }}
                        className={clsx(
                          active ? 'bg-surface-highlight' : '',
                          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary'
                        )}
                      >
                        {user.enabled ? (
                          <>
                            <LockClosedIcon className="h-4 w-4" />
                            Suspend User
                          </>
                        ) : (
                          <>
                            <LockOpenIcon className="h-4 w-4" />
                            Unsuspend User
                          </>
                        )}
                      </button>
                    )}
                  </Menu.Item>
                  {user.mfaEnabled && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDisableMfa(user.id, user.displayName);
                          }}
                          className={clsx(
                            active ? 'bg-surface-highlight' : '',
                            'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary'
                          )}
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                          Disable MFA
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPasswordReset(user.email, user.displayName);
                        }}
                        className={clsx(
                          active ? 'bg-surface-highlight' : '',
                          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-primary'
                        )}
                      >
                        <EnvelopeIcon className="h-4 w-4" />
                        Send Password Reset
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteUser(user.id, user.displayName);
                        }}
                        className={clsx(
                          active ? 'bg-status-error-bg' : '',
                          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-status-error-text min-h-[44px]'
                        )}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete User
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Portal>
          )}
        </>
      )}
    </Menu>
  );
}

export default function UserManagementPage() {
  const { session, user } = useAuth();

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [allRoles, setAllRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null); // Success banner
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateUserForm>(initialCreateForm);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
    actionLabel: string;
    variant: 'danger' | 'warning' | 'default';
  } | null>(null);

  // Edit user state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editForm, setEditForm] = useState<{ roles: string[]; companyIds: number[] }>({ roles: [], companyIds: [] });
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // State for view mode
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    const roles = user?.roles || [];
    const permissions = user?.permissions || [];
    return roles.includes('admin') || roles.includes('ROLE_ADMIN') || permissions.includes('admin') || permissions.includes('*');
  }, [user]);

  const normalizeUser = (u: UserDto): DirectoryUser => ({
    id: u.id ?? 0,
    publicId: u.publicId ?? '',
    displayName: u.displayName ?? '',
    email: u.email ?? '',
    enabled: u.enabled ?? false,
    mfaEnabled: u.mfaEnabled ?? false,
    roles: u.roles ?? [],
    companies: u.companies ?? [],
  });

  const refreshDirectory = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    setError(null);
    try {
      const [usersData, companiesData] = await Promise.all([
        listUsers(session),
        listCompanies(session).catch(() => []),
      ]);
      setUsers((usersData as UserDto[]).map(normalizeUser));
      setCompanies(companiesData as CompanyOption[]);
    } catch (e) {
      setError('Failed to sync directory.');
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [session]);

  const loadRoles = useCallback(() => {
    if (!session) return;
    listRoles(session)
      .then((roles: any) => {
        setAllRoles(roles.map((r: any) => ({ name: r.name, description: r.description })));
      })
      .catch(() => undefined);
  }, [session]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshDirectory(), loadRoles()]).finally(() => setLoading(false));
  }, [refreshDirectory, loadRoles]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.publicId.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'All roles') {
      result = result.filter(u => u.roles.includes(roleFilter));
    }
    return result;
  }, [users, debouncedSearch, roleFilter]);

  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      u.roles.forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [users]);

  const handleCreateUser = async () => {
    if (!session) return;
    setSaving(true);
    setFormError(null);

    if (!form.displayName || !form.email) {
      setFormError('Display name and email are required.');
      setSaving(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setFormError('Please enter a valid email address.');
      setSaving(false);
      return;
    }

    try {
      const payload: CreateUserRequest = {
        displayName: form.displayName,
        email: form.email,
        roles: form.roles,
        companyIds: form.companyIds,
      };
      await createUser(payload, session);

      setBanner(`User ${form.displayName} created successfully. An email with login instructions has been sent.`);
      setIsAddModalOpen(false);
      setForm(initialCreateForm);
      refreshDirectory();
    } catch (e: any) {
      // Handle specific error cases
      if (e?.status === 409 || e?.code === 'CONFLICT') {
        setFormError('A user with this email already exists. Please use a different email address.');
      } else if (e?.status === 422) {
        setFormError('Validation error: Please check that all fields are filled correctly.');
      } else if (e?.status === 400) {
        setFormError(e.message || 'Invalid request. Please check your input.');
      } else {
        setFormError(e instanceof Error ? e.message : 'Failed to create user. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setForm(initialCreateForm);
    setFormError(null);
  };

  const toggleRole = (role: string) => {
    setForm(prev => {
      const exists = prev.roles.includes(role);
      return {
        ...prev,
        roles: exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
      };
    });
  };

  const toggleCompany = (companyId: number) => {
    setForm(prev => {
      const exists = prev.companyIds.includes(companyId);
      return {
        ...prev,
        companyIds: exists ? prev.companyIds.filter(id => id !== companyId) : [...prev.companyIds, companyId]
      };
    });
  };

  const handleSuspendUser = async (userId: number, enabled: boolean, userName: string) => {
    if (!session) return;
    setConfirmDialog({
      open: true,
      title: enabled ? 'Suspend User' : 'Unsuspend User',
      message: `Are you sure you want to ${enabled ? 'suspend' : 'unsuspend'} "${userName}"? ${enabled ? 'The user will be notified via email.' : 'The user will be able to access the system again.'}`,
      action: async () => {
        try {
          if (enabled) {
            await suspendUser(userId, session);
            setBanner(`User "${userName}" has been suspended. A notification email has been sent.`);
          } else {
            await unsuspendUser(userId, session);
            setBanner(`User "${userName}" has been unsuspended and can now access the system.`);
          }
          refreshDirectory();
          setSelectedUser(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : `Failed to ${enabled ? 'suspend' : 'unsuspend'} user.`);
        } finally {
          setConfirmDialog(null);
        }
      },
      actionLabel: enabled ? 'Suspend' : 'Unsuspend',
      variant: 'warning',
    });
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!session) return;
    setConfirmDialog({
      open: true,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone. The user will be notified via email and all their tokens will be revoked.`,
      action: async () => {
        try {
          await deleteUser(userId, session);
          setBanner(`User "${userName}" has been deleted. A notification email has been sent and all active sessions have been revoked.`);
          refreshDirectory();
          setSelectedUser(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to delete user.');
        } finally {
          setConfirmDialog(null);
        }
      },
      actionLabel: 'Delete',
      variant: 'danger',
    });
  };

  const handleDisableMfa = async (userId: number, userName: string) => {
    if (!session) return;
    setConfirmDialog({
      open: true,
      title: 'Disable MFA',
      message: `Are you sure you want to disable MFA for "${userName}"? This will clear their MFA secret and recovery codes, revoke all active sessions, and require them to re-enroll MFA on next login.`,
      action: async () => {
        try {
          await disableUserMfa(userId, session);
          setBanner(`MFA has been disabled for "${userName}". All active sessions have been revoked. They will need to re-enroll MFA on next login.`);
          refreshDirectory();
          setSelectedUser(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to disable MFA.');
        } finally {
          setConfirmDialog(null);
        }
      },
      actionLabel: 'Disable MFA',
      variant: 'warning',
    });
  };

  const handlePasswordReset = async (userEmail: string, userName: string) => {
    if (!session) return;
    setConfirmDialog({
      open: true,
      title: 'Send Password Reset',
      message: `Are you sure you want to send a password reset email to "${userName}"? They will receive a link to set a new password.`,
      action: async () => {
        try {
          await apiForgotPassword(userEmail);
          setBanner(`Password reset email has been sent to "${userName}" (${userEmail}).`);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to send password reset email.');
        } finally {
          setConfirmDialog(null);
        }
      },
      actionLabel: 'Send Email',
      variant: 'default',
    });
  };

  const handleStartEditUser = () => {
    if (!selectedUser || !isAdmin) return;
    // Map company names to IDs
    const companyIds = selectedUser.companies
      .map(companyName => companies.find(c => c.name === companyName || c.code === companyName)?.id)
      .filter((id): id is number => id !== undefined);

    setEditForm({
      roles: [...selectedUser.roles],
      companyIds: companyIds,
    });
    setIsEditingUser(true);
    setUpdateError(null);
  };

  const handleCancelEditUser = () => {
    setIsEditingUser(false);
    setEditForm({ roles: [], companyIds: [] });
    setUpdateError(null);
  };

  const toggleEditRole = (role: string) => {
    setEditForm(prev => {
      const exists = prev.roles.includes(role);
      return {
        ...prev,
        roles: exists ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
      };
    });
  };

  const toggleEditCompany = (companyId: number) => {
    setEditForm(prev => {
      const exists = prev.companyIds.includes(companyId);
      return {
        ...prev,
        companyIds: exists ? prev.companyIds.filter(id => id !== companyId) : [...prev.companyIds, companyId]
      };
    });
  };

  const handleUpdateUser = async () => {
    if (!session || !selectedUser || !isAdmin) return;

    setUpdatingUser(true);
    setUpdateError(null);

    try {
      const payload: UpdateUserRequest = {
        displayName: selectedUser.displayName,
        roles: editForm.roles,
        companyIds: editForm.companyIds,
      };

      await updateUser(selectedUser.id, payload, session);
      setBanner(`User "${selectedUser.displayName}" roles and companies have been updated successfully. This action has been audited.`);
      setIsEditingUser(false);
      refreshDirectory();
      // Update selectedUser to reflect changes
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        const normalized = normalizeUser({
          ...updatedUser,
          roles: editForm.roles,
          companies: editForm.companyIds.map(id => {
            const company = companies.find(c => c.id === id);
            return company ? company.name : '';
          }).filter(Boolean),
        });
        setSelectedUser(normalized);
      }
    } catch (e: any) {
      if (e?.status === 403) {
        setUpdateError('Access denied. Only administrators can update user roles and companies.');
      } else if (e?.status === 400 || e?.status === 422) {
        setUpdateError(e?.message || 'Invalid request. Please check your input.');
      } else {
        setUpdateError(e instanceof Error ? e.message : 'Failed to update user. Please try again.');
      }
    } finally {
      setUpdatingUser(false);
    }
  };

  if (!session) return null;

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-8">
      {/* Header */}
      <PageHeader
        title="User Management"
        subtitle="Manage access, roles, and permissions across the enterprise."
        actions={
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center p-1 rounded-lg bg-surface-highlight border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === 'list'
                    ? "bg-background text-primary shadow-sm"
                    : "text-secondary hover:text-primary"
                )}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={clsx(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === 'grouped'
                    ? "bg-background text-primary shadow-sm"
                    : "text-secondary hover:text-primary"
                )}
              >
                Group by Role
              </button>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block"></div>
            <button
              onClick={refreshDirectory}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-surface-highlight transition-colors"
            >
              <ArrowPathIcon className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
              Sync
            </button>
            <ResponsiveButton
              onClick={() => setIsAddModalOpen(true)}
              id="users-add-btn"
              variant="primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add User
            </ResponsiveButton>
          </div>
        }
      />

      {banner && (
        <div className="flex items-center justify-between rounded-md bg-status-success-bg p-4 text-sm text-status-success-text">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="ml-4 font-medium hover:opacity-80">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {/* Role Breakdown Collapsible */}
      <Disclosure as="div" id="users-list" className="overflow-hidden rounded-xl border border-border bg-background">
        {({ open }) => (
          <>
            <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-primary hover:bg-surface-highlight transition-colors">
              <span className="truncate">Role Distribution ({roleBreakdown.length} roles)</span>
              <ChevronUpIcon className={clsx('h-4 w-4 text-tertiary transition-transform shrink-0', !open && 'rotate-180')} />
            </Disclosure.Button>
            <Disclosure.Panel className="px-2 sm:px-4 pb-4 pt-2 text-sm text-secondary">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {roleBreakdown.map(([role, count]) => (
                  <div key={role} className="rounded-md border border-border bg-surface-highlight p-1.5 sm:p-2">
                    <div className="font-mono text-xs font-medium text-primary truncate" title={role}>{formatRoleName(role)}</div>
                    <div className="mt-1 text-xs text-secondary">{count} users</div>
                  </div>
                ))}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-4 text-sm text-primary outline-none focus:border-action-bg focus:ring-1 focus:ring-action-bg transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FunnelIcon className="h-4 w-4 text-tertiary" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-md border border-border bg-background px-3 text-sm text-primary outline-none focus:border-action-bg focus:ring-1 focus:ring-action-bg transition-all"
          >
            <option>All roles</option>
            {allRoles.map((r) => <option key={r.name}>{r.name}</option>)}
          </select>
        </div>
      </div>

      {/* Users View */}
      {viewMode === 'list' ? (
        <UserTable
          users={filteredUsers}
          loading={loading}
          onViewDetails={setSelectedUser}
          onSuspendUser={handleSuspendUser}
          onDisableMfa={handleDisableMfa}
          onPasswordReset={handlePasswordReset}
          onDeleteUser={handleDeleteUser}
        />
      ) : (
        <GroupedUserList
          users={filteredUsers}
          allRoles={allRoles}
          loading={loading}
          onViewDetails={setSelectedUser}
          onSuspendUser={handleSuspendUser}
          onDisableMfa={handleDisableMfa}
          onPasswordReset={handlePasswordReset}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* User Detail Modal */}
      <ResponsiveModal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.displayName || 'User Details'}
        size="xl"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               {/* Header Info */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-surface-highlight flex items-center justify-center text-lg font-medium text-secondary">
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold leading-6 text-primary">
                      {selectedUser.displayName}
                    </h3>
                    <p className="mt-1 text-sm text-secondary">{selectedUser.email}</p>
                  </div>
                </div>
            </div>

            {isEditingUser ? (
              <div className="space-y-6">
                {updateError && (
                  <div className="rounded-lg border border-status-error-bg bg-status-error-bg p-3 text-sm text-status-error-text">
                    {updateError}
                  </div>
                )}

                {/* Roles Section */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {CORE_PORTAL_ROLE_OPTIONS.map(role => (
                      <button
                        key={role.name}
                        type="button"
                        onClick={() => toggleEditRole(role.name)}
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-manipulation min-h-[36px]",
                          editForm.roles.includes(role.name)
                            ? "bg-action-bg text-action-text border-action-bg shadow-sm"
                            : "bg-background text-primary border-border hover:bg-surface-highlight"
                        )}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                  {editForm.roles.length === 0 && (
                    <p className="mt-2 text-xs text-secondary">No roles selected. User will have no portal access.</p>
                  )}
                </div>

                {/* Companies Section */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">Companies</label>
                  {companies.length === 0 ? (
                    <p className="text-sm text-secondary">No companies available.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {companies.map(company => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => toggleEditCompany(company.id)}
                            className={clsx(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-manipulation min-h-[36px]",
                              editForm.companyIds.includes(company.id)
                                ? "bg-action-bg text-action-text border-action-bg shadow-sm"
                                : "bg-background text-primary border-border hover:bg-surface-highlight"
                            )}
                          >
                            {company.code} - {company.name}
                          </button>
                        ))}
                      </div>
                      {editForm.companyIds.length === 0 && (
                        <p className="mt-2 text-xs text-secondary">No companies selected.</p>
                      )}
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <ResponsiveButton
                    variant="outline"
                    onClick={handleCancelEditUser}
                    disabled={updatingUser}
                  >
                    Cancel
                  </ResponsiveButton>
                  <ResponsiveButton
                    variant="primary"
                    onClick={handleUpdateUser}
                    disabled={updatingUser}
                  >
                    {updatingUser ? 'Updating...' : 'Save Changes'}
                  </ResponsiveButton>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-secondary">Public ID</span>
                    <p className="mt-2 font-mono text-sm text-primary break-all">{selectedUser.publicId}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-secondary">Status</span>
                    <div className="mt-2">
                      <span className={clsx(
                        'inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5',
                        selectedUser.enabled ? 'bg-status-success-bg text-status-success-text' : 'bg-status-error-bg text-status-error-text'
                      )}>
                        {selectedUser.enabled ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-secondary">MFA Status</span>
                    <div className="mt-2 flex items-center gap-2">
                      {selectedUser.mfaEnabled ? (
                        <span className="flex items-center gap-1 text-sm text-status-success-text">
                          <ShieldCheckIcon className="h-4 w-4" /> Enabled
                        </span>
                      ) : (
                        <span className="text-sm text-secondary">Disabled</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-secondary">Companies</span>
                    <p className="mt-2 text-sm text-primary">
                      {selectedUser.companies.length > 0 ? selectedUser.companies.join(', ') : 'None'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-secondary">Roles</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={handleStartEditUser}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-surface-highlight transition-colors"
                        >
                          <PencilSquareIcon className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedUser.roles.length > 0 ? (
                        selectedUser.roles.map(r => (
                          <span key={r} className="inline-flex items-center rounded-full border border-border bg-surface-highlight px-3 py-1 text-xs font-medium text-primary">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-tertiary italic">No roles assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <ResponsiveButton
                      variant="outline"
                      onClick={handleStartEditUser}
                      className="w-full sm:w-auto"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Edit Roles & Companies
                    </ResponsiveButton>
                    <p className="mt-2 text-xs text-secondary">
                      Changes to user roles and companies are audited for security compliance.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </ResponsiveModal>

      {/* Confirmation Dialog */}
      <ResponsiveModal
        isOpen={confirmDialog?.open ?? false}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title}
        size="md"
        footer={
           <>
              <ResponsiveButton
                variant="outline"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </ResponsiveButton>
              <ResponsiveButton
                 variant={confirmDialog?.variant === 'danger' || confirmDialog?.variant === 'warning' ? 'danger' : 'primary'}
                 onClick={() => confirmDialog?.action()}
              >
                {confirmDialog?.actionLabel}
              </ResponsiveButton>
           </>
        }
      >
        <p className="text-sm text-secondary">
            {confirmDialog?.message}
        </p>
      </ResponsiveModal>

      {/* Add User Modal */}
      <ResponsiveModal
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        title="Create New User"
        size="lg"
        footer={
          <>
            <ResponsiveButton
              variant="outline"
              onClick={handleModalClose}
              disabled={saving}
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton
              variant="primary"
              onClick={handleCreateUser}
              disabled={saving || !form.displayName || !form.email}
            >
              {saving ? 'Creating...' : 'Create User'}
            </ResponsiveButton>
          </>
        }
      >
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Display Name <span className="text-status-error-text">*</span>
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  className="mt-1 block w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-primary shadow-sm focus:border-action-bg focus:ring-1 focus:ring-action-bg"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Email <span className="text-status-error-text">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-primary shadow-sm focus:border-action-bg focus:ring-1 focus:ring-action-bg"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Information about password generation */}
          <div className="rounded-lg border border-status-info-bg bg-status-info-bg p-3 text-sm text-status-info-text">
            <p className="flex items-start gap-2">
              <EnvelopeIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>A temporary password will be automatically generated and emailed to the user upon creation.</span>
            </p>
          </div>

          {/* Roles Section */}
          <div>
            <label className="block text-sm font-semibold text-primary mb-3">Roles</label>
            <div className="flex flex-wrap gap-2">
              {CORE_PORTAL_ROLE_OPTIONS.map(role => (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => toggleRole(role.name)}
                  className={clsx(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-manipulation min-h-[36px]",
                    form.roles.includes(role.name)
                      ? "bg-action-bg text-action-text border-action-bg shadow-sm"
                      : "bg-background text-primary border-border hover:bg-surface-highlight"
                  )}
                >
                  {role.label}
                </button>
              ))}
            </div>
            {form.roles.length === 0 && (
              <p className="mt-2 text-xs text-secondary">No roles selected. User will have no portal access.</p>
            )}
          </div>

          {/* Companies Section */}
          <div>
            <label className="block text-sm font-semibold text-primary mb-3">Companies</label>
            {companies.length === 0 ? (
              <p className="text-sm text-secondary">No companies available.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => toggleCompany(company.id)}
                      className={clsx(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-manipulation min-h-[36px]",
                        form.companyIds.includes(company.id)
                          ? "bg-action-bg text-action-text border-action-bg shadow-sm"
                          : "bg-background text-primary border-border hover:bg-surface-highlight"
                      )}
                    >
                      {company.code} - {company.name}
                    </button>
                  ))}
                </div>
                {form.companyIds.length === 0 && (
                  <p className="mt-2 text-xs text-secondary">No companies selected.</p>
                )}
              </>
            )}
          </div>
        </div>

        {formError && (
          <div className="rounded-lg border border-status-error-bg bg-status-error-bg p-3 text-sm text-status-error-text mt-4">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{formError}</span>
            </div>
          </div>
        )}
      </ResponsiveModal>
    </ResponsiveContainer>
  );
}