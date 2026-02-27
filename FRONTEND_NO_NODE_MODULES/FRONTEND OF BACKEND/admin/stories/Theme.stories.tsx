import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Theme',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

const ColorSwatch = ({ name, variable, value }: { name: string; variable: string; value?: string }) => (
  <div className="flex flex-col gap-2">
    <div 
      className="h-24 w-full rounded-lg shadow-sm border border-border" 
      style={{ backgroundColor: `var(${variable})` }}
    />
    <div className="flex flex-col">
      <span className="font-semibold text-primary">{name}</span>
      <code className="text-xs text-secondary">{variable}</code>
    </div>
  </div>
);

const ThemeDisplay = () => {
  return (
    <div className="min-h-screen bg-background p-8 text-primary transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-12">
        <div>
          <h1 className="text-4xl font-display font-bold mb-4">Unified Design System</h1>
          <p className="text-secondary text-lg max-w-3xl">
            This theme uses a Zinc/Slate based palette for a premium, enterprise-grade feel. 
            Primary actions are dark (Zinc 900) in light mode and light (Zinc 50) in dark mode.
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-border pb-2">Backgrounds</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ColorSwatch name="Primary Background" variable="--bg-primary" />
            <ColorSwatch name="Surface" variable="--bg-surface" />
            <ColorSwatch name="Surface Highlight" variable="--bg-surface-highlight" />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-border pb-2">Text Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 bg-white rounded-lg border border-zinc-200">
              <h3 className="mb-4 text-sm font-bold text-zinc-400 uppercase tracking-wider">On Light</h3>
              <div className="space-y-2">
                <p style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">Primary Text</p>
                <p style={{ color: 'var(--text-secondary)' }}>Secondary Text</p>
                <p style={{ color: 'var(--text-tertiary)' }}>Tertiary Text</p>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <h3 className="mb-4 text-sm font-bold text-zinc-600 uppercase tracking-wider">On Dark</h3>
               <div className="space-y-2">
                <p className="text-xl font-bold text-white">Primary Text</p>
                <p className="text-zinc-400">Secondary Text</p>
                <p className="text-zinc-600">Tertiary Text</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-border pb-2">Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="flex flex-col gap-2">
                <div 
                  className="h-12 w-full rounded-lg flex items-center justify-center font-medium shadow-sm" 
                  style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
                >
                  Primary Action
                </div>
                <code className="text-xs text-secondary">--action-primary-bg</code>
             </div>
              <div className="flex flex-col gap-2">
                <div 
                  className="h-12 w-full rounded-lg flex items-center justify-center font-medium shadow-sm" 
                  style={{ backgroundColor: 'var(--action-primary-hover)', color: 'var(--action-primary-text)' }}
                >
                  Primary Hover
                </div>
                <code className="text-xs text-secondary">--action-primary-hover</code>
             </div>
          </div>
        </section>

         <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-border pb-2">Status Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ColorSwatch name="Success" variable="--status-success-bg" />
            <ColorSwatch name="Warning" variable="--status-warning-bg" />
            <ColorSwatch name="Error" variable="--status-error-bg" />
            <ColorSwatch name="Info" variable="--status-info-bg" />
          </div>
        </section>
      </div>
    </div>
  );
};

export const Palette: Story = {
  render: () => <ThemeDisplay />,
};
