import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveModal } from '../design-system/ResponsiveModal';
import { ResponsiveButton } from '../design-system/ResponsiveButton';

const meta: Meta<typeof ResponsiveModal> = {
  title: 'Design System/ResponsiveModal',
  component: ResponsiveModal,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveModal>;

export const Default: Story = {
  render: (args: React.ComponentProps<typeof ResponsiveModal>) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <ResponsiveButton onClick={() => setIsOpen(true)}>Open Modal</ResponsiveButton>
        <ResponsiveModal 
          {...args} 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Confirmation Required"
          footer={
            <>
              <ResponsiveButton variant="outline" onClick={() => setIsOpen(false)}>Cancel</ResponsiveButton>
              <ResponsiveButton variant="primary" onClick={() => setIsOpen(false)}>Confirm</ResponsiveButton>
            </>
          }
        >
          <p className="text-zinc-600 dark:text-zinc-300">
            Are you sure you want to proceed with this action? This cannot be undone.
          </p>
        </ResponsiveModal>
      </>
    );
  },
};

export const LargeWithForm: Story = {
  render: (args: React.ComponentProps<typeof ResponsiveModal>) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <ResponsiveButton onClick={() => setIsOpen(true)}>Open Form Modal</ResponsiveButton>
        <ResponsiveModal 
          {...args} 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          title="Edit User Profile"
          size="lg"
          footer={
            <>
              <ResponsiveButton variant="ghost" onClick={() => setIsOpen(false)}>Cancel</ResponsiveButton>
              <ResponsiveButton variant="primary" onClick={() => setIsOpen(false)}>Save Changes</ResponsiveButton>
            </>
          }
        >
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">First Name</label>
                 <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" defaultValue="Jane" />
               </div>
               <div className="space-y-1">
                 <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Last Name</label>
                 <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" defaultValue="Doe" />
               </div>
             </div>
             <div className="space-y-1">
               <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Email Address</label>
               <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" defaultValue="jane.doe@example.com" />
             </div>
          </div>
        </ResponsiveModal>
      </>
    );
  },
};
