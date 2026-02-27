import type { Meta, StoryObj } from '@storybook/react';
import { ResponsiveButton } from '../design-system/ResponsiveButton';
import { UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof ResponsiveButton> = {
  title: 'Design System/ResponsiveButton',
  component: ResponsiveButton,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ResponsiveButton>;

export const Primary: Story = {
  args: {
    children: 'Primary Action',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Action',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  args: {
    children: 'Danger Action',
    variant: 'danger',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Profile',
    icon: <UserIcon className="h-5 w-5" />,
  },
};

export const Loading: Story = {
  args: {
    children: 'Saving...',
    loading: true,
  },
};
