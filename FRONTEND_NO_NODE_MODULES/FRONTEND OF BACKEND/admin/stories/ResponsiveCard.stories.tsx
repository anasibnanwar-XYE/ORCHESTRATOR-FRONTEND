import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveCard } from '../design-system/ResponsiveCard';
import { ResponsiveButton } from '../design-system/ResponsiveButton';

const meta: Meta<typeof ResponsiveCard> = {
  title: 'Design System/ResponsiveCard',
  component: ResponsiveCard,
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResponsiveCard>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    subtitle: 'This is a helpful subtitle for the card.',
    children: <p className="text-zinc-600 dark:text-zinc-300">This is the main content area of the card. It handles padding automatically.</p>,
  },
};

export const WithActions: Story = {
  args: {
    title: 'Order Details',
    subtitle: 'Order #12345',
    actions: <ResponsiveButton size="sm" variant="outline">View Full</ResponsiveButton>,
    children: (
      <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="font-medium text-emerald-600">Delivered</span>
        </div>
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium text-zinc-900 dark:text-white">$1,250.00</span>
        </div>
      </div>
    ),
  },
};

export const Interactive: Story = {
  args: {
    title: 'Clickable Card',
    subtitle: 'Hover over me',
    hover: true,
    children: <p className="text-zinc-600 dark:text-zinc-300">This card has a hover effect and shadow transition.</p>,
    className: 'cursor-pointer',
  },
};
