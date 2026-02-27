/**
 * Example usage of the unified responsive design system
 * This demonstrates how to use all components together
 */

import React, { useState } from 'react';
import {
  BaseLayout,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveButton,
  ResponsiveModal,
  ResponsiveDataTable,
  ResponsiveForm,
  FormInput,
  FormSelect,
  useResponsive,
} from './index';
import { ResponsiveNavigation } from '../components/ResponsiveNavigation';

// Example data type
interface ExampleItem {
  id: number;
  name: string;
  status: string;
  amount: number;
}

// Example page component
export function ExamplePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { isMobile } = useResponsive();

  // Example navigation items
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <HomeIcon /> },
    { label: 'Orders', path: '/orders', icon: <OrdersIcon />, badge: 5 },
    { label: 'Products', path: '/products', icon: <ProductsIcon /> },
  ];

  // Example data
  const data: ExampleItem[] = [
    { id: 1, name: 'Item 1', status: 'Active', amount: 100 },
    { id: 2, name: 'Item 2', status: 'Pending', amount: 200 },
  ];

  // Example table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: ExampleItem) => item.name,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ExampleItem) => (
        <span className={`px-2 py-1 rounded text-xs ${
          item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: ExampleItem) => `$${item.amount}`,
      mobileHidden: true,
    },
  ];

  return (
    <BaseLayout
      sidebar={
        <div className="p-4">
          <ResponsiveNavigation items={navItems} />
        </div>
      }
      headerTitle="Example Page"
      headerActions={
        <ResponsiveButton
          variant="primary"
          size={isMobile ? 'sm' : 'md'}
          onClick={() => setModalOpen(true)}
        >
          Add New
        </ResponsiveButton>
      }
    >
      <ResponsiveContainer>
        {/* Dashboard Cards */}
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md" className="mb-6">
          <ResponsiveCard title="Total Sales" padding="md">
            <div className="text-2xl font-bold">$10,000</div>
            <div className="text-sm text-gray-500 mt-1">+12% from last month</div>
          </ResponsiveCard>
          <ResponsiveCard title="Orders" padding="md">
            <div className="text-2xl font-bold">245</div>
            <div className="text-sm text-gray-500 mt-1">+8% from last month</div>
          </ResponsiveCard>
          <ResponsiveCard title="Customers" padding="md">
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-gray-500 mt-1">+5% from last month</div>
          </ResponsiveCard>
          <ResponsiveCard title="Revenue" padding="md">
            <div className="text-2xl font-bold">$45,678</div>
            <div className="text-sm text-gray-500 mt-1">+15% from last month</div>
          </ResponsiveCard>
        </ResponsiveGrid>

        {/* Data Table */}
        <ResponsiveCard title="Items" actions={
          <ResponsiveButton variant="outline" size="sm" onClick={() => setModalOpen(true)}>
            Add Item
          </ResponsiveButton>
        }>
          <ResponsiveDataTable
            data={data}
            columns={columns}
            keyExtractor={(item) => item.id}
            searchable
            pagination
            pageSize={10}
          />
        </ResponsiveCard>
      </ResponsiveContainer>

      {/* Modal */}
      <ResponsiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Item"
        footer={
          <>
            <ResponsiveButton variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </ResponsiveButton>
            <ResponsiveButton variant="primary" onClick={() => {
              // Handle submit
              setModalOpen(false);
            }}>
              Save
            </ResponsiveButton>
          </>
        }
      >
        <ResponsiveForm onSubmit={(e) => {
          e.preventDefault();
          // Handle form submission
        }}>
          <FormInput
            label="Name"
            required
            placeholder="Enter name"
          />
          <FormSelect
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
            ]}
          />
        </ResponsiveForm>
      </ResponsiveModal>
    </BaseLayout>
  );
}

// Placeholder icons (replace with actual icons)
function HomeIcon() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>;
}

function OrdersIcon() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>;
}

function ProductsIcon() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>;
}













