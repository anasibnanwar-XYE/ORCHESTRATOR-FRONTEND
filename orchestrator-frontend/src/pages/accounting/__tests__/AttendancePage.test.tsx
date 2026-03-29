 /**
  * AttendancePage tests
  */
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 import { AttendancePage } from '../AttendancePage';
 import { hrApi } from '@/lib/hrApi';
 import { ToastProvider } from '@/components/ui/Toast';
 
 vi.mock('@/lib/hrApi', () => ({
   hrApi: {
     getEmployees: vi.fn(),
     getAttendanceToday: vi.fn(),
     getAttendanceByDate: vi.fn(),
     getAttendanceSummary: vi.fn(),
     getMonthlyAttendanceSummary: vi.fn(),
     getEmployeeAttendance: vi.fn(),
     markAttendance: vi.fn(),
     bulkMarkAttendance: vi.fn(),
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
   {
     id: 2,
     publicId: 'emp-002',
     employeeCode: 'EMP002',
     firstName: 'Priya',
     lastName: 'Patel',
     email: 'priya@company.com',
     employeeType: 'STAFF' as const,
     paymentSchedule: 'MONTHLY' as const,
     status: 'ACTIVE' as const,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
 ];
 
 const mockAttendance = [
   {
     id: 1,
     employeeId: 1,
     employeeCode: 'EMP001',
     employeeName: 'Rahul Sharma',
     date: '2024-01-15',
     status: 'PRESENT' as const,
   },
   {
     id: 2,
     employeeId: 2,
     employeeCode: 'EMP002',
     employeeName: 'Priya Patel',
     date: '2024-01-15',
     status: 'ABSENT' as const,
   },
 ];
 
 const mockSummary = {
   date: '2024-01-15',
   present: 1,
   absent: 1,
   halfDay: 0,
   onLeave: 0,
   total: 2,
 };
 
 const mockMonthlySummary = [
   {
     employeeId: 1,
     employeeCode: 'EMP001',
     employeeName: 'Rahul Sharma',
     year: 2024,
     month: 1,
     presentDays: 20,
     absentDays: 2,
     halfDays: 1,
     leaveDays: 3,
     holidayDays: 0,
     weekendDays: 8,
     totalWorkingDays: 26,
     regularHours: 160,
     overtimeHours: 5,
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter>
       <ToastProvider>
         <AttendancePage />
       </ToastProvider>
     </MemoryRouter>
   );
 }
 
 describe('AttendancePage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     vi.mocked(hrApi.getEmployees).mockResolvedValue(mockEmployees);
     vi.mocked(hrApi.getAttendanceToday).mockResolvedValue(mockAttendance);
     vi.mocked(hrApi.getAttendanceSummary).mockResolvedValue(mockSummary);
     vi.mocked(hrApi.getMonthlyAttendanceSummary).mockResolvedValue(mockMonthlySummary);
     vi.mocked(hrApi.getEmployeeAttendance).mockResolvedValue(mockAttendance);
   });
 
   it('renders the Attendance page heading', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Attendance')).toBeInTheDocument();
     });
   });
 
   it('shows Daily Register tab by default', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Daily Register')).toBeInTheDocument();
     });
   });
 
   it('shows employee names in attendance register', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText(/Rahul Sharma/i).length).toBeGreaterThan(0);
       expect(screen.getAllByText(/Priya Patel/i).length).toBeGreaterThan(0);
     });
   });
 
   it('shows Present and Absent status badges', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Present').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Absent').length).toBeGreaterThan(0);
     });
   });
 
   it('shows Bulk Mark button in register', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Bulk Mark')).toBeInTheDocument();
     });
   });
 
   it('shows Monthly Summary tab option', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Monthly Summary')).toBeInTheDocument();
     });
   });
 
   it('shows Employee Calendar tab option', async () => {
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Employee Calendar')).toBeInTheDocument();
     });
   });
 
   it('shows error state when attendance load fails', async () => {
     vi.mocked(hrApi.getAttendanceToday).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/Failed to load attendance/i)).toBeInTheDocument();
     });
   });
 });
