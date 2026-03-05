 /**
  * LeaveRequestsPage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, fireEvent, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { LeaveRequestsPage } from '../LeaveRequestsPage';
 import { hrApi } from '@/lib/hrApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/hrApi', () => ({
   hrApi: {
     getEmployees: vi.fn(),
     getLeaveRequests: vi.fn(),
     getLeaveTypes: vi.fn(),
     createLeaveRequest: vi.fn(),
     updateLeaveStatus: vi.fn(),
     getLeaveBalances: vi.fn(),
   },
 }));
 
 const mockEmployees = [
   {
     id: 1,
     publicId: 'emp-001',
     employeeCode: 'EMP001',
     firstName: 'Rahul',
     lastName: 'Sharma',
     email: 'rahul@company.com',
     employeeType: 'STAFF' as const,
     paymentSchedule: 'MONTHLY' as const,
     status: 'ACTIVE' as const,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
 ];
 
 const mockLeaveRequests = [
   {
     id: 1,
     employeeId: 1,
     employeeName: 'Rahul Sharma',
     employeeCode: 'EMP001',
     leaveType: 'ANNUAL',
     startDate: '2024-01-20',
     endDate: '2024-01-22',
     totalDays: 3,
     reason: 'Personal work',
     status: 'PENDING' as const,
     createdAt: '2024-01-15T00:00:00Z',
   },
   {
     id: 2,
     employeeId: 1,
     employeeName: 'Rahul Sharma',
     employeeCode: 'EMP001',
     leaveType: 'SICK',
     startDate: '2024-01-10',
     endDate: '2024-01-11',
     totalDays: 2,
     reason: 'Not feeling well',
     status: 'APPROVED' as const,
     approvedBy: 'Manager',
     approvedAt: '2024-01-09T10:00:00Z',
     createdAt: '2024-01-09T00:00:00Z',
   },
 ];
 
 const mockLeaveTypes = [
   { id: 1, leaveType: 'ANNUAL', annualEntitlement: 15, carryForwardLimit: 5, active: true },
   { id: 2, leaveType: 'SICK', annualEntitlement: 12, carryForwardLimit: 0, active: true },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <LeaveRequestsPage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('LeaveRequestsPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(hrApi.getEmployees).mockResolvedValue(mockEmployees);
     vi.mocked(hrApi.getLeaveRequests).mockResolvedValue(mockLeaveRequests);
     vi.mocked(hrApi.getLeaveTypes).mockResolvedValue(mockLeaveTypes);
     vi.mocked(hrApi.getLeaveBalances).mockResolvedValue([]);
   });
 
   it('renders the Leave Requests page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Leave Requests')).toBeInTheDocument();
     });
   });
 
   it('shows employee names in leave requests table', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0);
     });
   });
 
   it('shows leave type badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('ANNUAL').length).toBeGreaterThan(0);
       expect(screen.getAllByText('SICK').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Pending and Approved status badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
     });
   });
 
   it('shows New Request button', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('New Request')).toBeInTheDocument();
     });
   });
 
   it('opens submit leave form when New Request is clicked', async () => {
     renderPage();
     await waitFor(() => expect(screen.getByText('New Request')).toBeInTheDocument());
     fireEvent.click(screen.getByText('New Request'));
     await waitFor(() => {
       expect(screen.getByText('New Leave Request')).toBeInTheDocument();
     });
   });
 
   it('shows error state on API failure', async () => {
     vi.mocked(hrApi.getLeaveRequests).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load leave requests/i)).toBeInTheDocument();
     });
   });
 
   it('shows status filter tabs', async () => {
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
     });
   });
 });
