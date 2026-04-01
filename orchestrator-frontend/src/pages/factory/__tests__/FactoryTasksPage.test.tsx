 /**
  * Tests for FactoryTasksPage
  *
  * Covers:
  *  - Renders page heading
  *  - Shows loading skeleton initially
  *  - Renders task rows after data loads
  *  - Shows error state on API failure
  *  - Opens create modal on "New Task" button click
  *  - Shows empty state when no tasks
  */

 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor, fireEvent } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const M = () => null;
  const stubs: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) stubs[key] = M;
  return stubs;
});

 vi.mock('@/lib/factoryApi', () => ({
   factoryApi: {
     getFactoryTasks: vi.fn(),
     createFactoryTask: vi.fn(),
     updateFactoryTask: vi.fn(),
   },
 }));

 import { FactoryTasksPage } from '../FactoryTasksPage';
 import { factoryApi } from '@/lib/factoryApi';

 const mockTasks = [
   {
     id: 1,
     title: 'Inspect production line A',
     description: 'Weekly inspection',
     assignee: 'Ahmad',
     priority: 'HIGH',
     status: 'OPEN',
     dueDate: '2026-03-15',
     createdAt: '2026-03-01T08:00:00Z',
   },
   {
     id: 2,
     title: 'Calibrate filling machine',
     description: 'Monthly calibration',
     assignee: 'Sara',
     priority: 'MEDIUM',
     status: 'IN_PROGRESS',
     dueDate: '2026-03-20',
     createdAt: '2026-03-02T08:00:00Z',
   },
 ];

 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/factory/config/tasks']}>
       <FactoryTasksPage />
     </MemoryRouter>
   );
 }

 describe('FactoryTasksPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
   });

   it('renders the page heading', async () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
     renderPage();
     expect(screen.getByText('Factory Tasks')).toBeDefined();
   });

   it('shows loading skeleton initially', () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });

   it('renders task rows after data loads', async () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
     renderPage();
     await waitFor(() => {
       const items = screen.getAllByText('Inspect production line A');
       expect(items.length).toBeGreaterThan(0);
     });
   });

   it('shows error state on API failure', async () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/couldn't load|retry/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });

   it('opens create modal when New Task button is clicked', async () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockResolvedValue(mockTasks);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Factory Tasks')).toBeDefined();
     });
     const btn = screen.getByText('New Task');
     fireEvent.click(btn);
     await waitFor(() => {
       expect(screen.getByText('New Factory Task')).toBeDefined();
     });
   });

   it('shows empty state when no tasks exist', async () => {
     (factoryApi.getFactoryTasks as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
       const msgs = screen.getAllByText(/no factory tasks/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 });
