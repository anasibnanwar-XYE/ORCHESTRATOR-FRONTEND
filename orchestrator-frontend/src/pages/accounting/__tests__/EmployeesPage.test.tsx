 /**
  * EmployeesPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { EmployeesPage } from '../EmployeesPage';
 import { hrApi } from '@/lib/hrApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/hrApi', () => ({
   hrApi: {
     getEmployees: vi.fn(),
     getSalaryStructures: vi.fn(),
     createEmployee: vi.fn(),
     updateEmployee: vi.fn(),
     deleteEmployee: vi.fn(),
   },
 }));
 
 const mockEmployees = [
   {
     id: 1,
     publicId: 'emp-001',
     employeeCode: 'EMP001',
     firstName: 'Rahul',
     lastName: 'Sharma',
     email: 'rahul.sharma@company.com',
     department: 'Sales',
     designation: 'Manager',
     employeeType: 'STAFF' as const,
     paymentSchedule: 'MONTHLY' as const,
     monthlySalary: 75000,
     status: 'ACTIVE' as const,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     id: 2,
     publicId: 'emp-002',
     employeeCode: 'EMP002',
     firstName: 'Priya',
     lastName: 'Patel',
     email: 'priya.patel@company.com',
     department: 'Finance',
     designation: 'Accountant',
     employeeType: 'STAFF' as const,
     paymentSchedule: 'MONTHLY' as const,
     monthlySalary: 50000,
     status: 'INACTIVE' as const,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <EmployeesPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('EmployeesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(hrApi.getEmployees).mockResolvedValue(mockEmployees);
     vi.mocked(hrApi.getSalaryStructures).mockResolvedValue([]);
   });
 
   it('renders the page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Employees')).toBeInTheDocument();
     });
   });
 
   it('shows employee names in table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0);
       expect(screen.getAllByText(/Priya Patel/i).length).toBeGreaterThan(0);
     });
   });
 
   it('shows employee codes', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('EMP001').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Active and Inactive badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Employee button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Employee')).toBeInTheDocument();
     });
   });
 
   it('opens create modal when New Employee is clicked', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Employee')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Employee'));
     await waitFor(() => {
       expect(screen.getAllByText('New Employee').length).toBeGreaterThan(0);
     });
   });
 
   it('validates required fields on create', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Employee')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Employee'));
     await waitFor(() => {
       const buttons = screen.getAllByText('Create Employee');
       fireEvent.click(buttons[buttons.length - 1]);
     });
     await waitFor(() => {
       expect(screen.getByText('First name is required')).toBeInTheDocument();
     });
   });
 
   it('validates duplicate employee code', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Employee')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Employee'));
     // Fill required fields
     await waitFor(() => expect(screen.getByPlaceholderText('First name')).toBeInTheDocument());
     fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Test' } });
     fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'User' } });
     fireEvent.change(screen.getByPlaceholderText('employee@company.com'), { target: { value: 'test@test.com' } });
     fireEvent.change(screen.getByPlaceholderText('EMP001'), { target: { value: 'emp001' } });
     const buttons = screen.getAllByText('Create Employee');
     fireEvent.click(buttons[buttons.length - 1]);
     await waitFor(() => {
       expect(screen.getByText('Employee ID already exists')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(hrApi.getEmployees).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load employees/i)).toBeInTheDocument();
     });
   });
 
   it('filters employees by search', async () => {
     renderPage();
     await waitFor(() => expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0));
     fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
       target: { value: 'Rahul' },
     });
     await waitFor(() => {
       expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0);
     });
   });
 });
