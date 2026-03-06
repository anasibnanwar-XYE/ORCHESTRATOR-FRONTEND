import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '../DataTable';

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const columns: Column<User>[] = [
  { id: 'name', header: 'Name', accessor: (row) => row.name, sortable: true, sortAccessor: (row) => row.name },
  { id: 'email', header: 'Email', accessor: (row) => row.email },
  { id: 'age', header: 'Age', accessor: (row) => row.age, sortable: true, sortAccessor: (row) => row.age, align: 'right' },
];

const data: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: '2', name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: '3', name: 'Charlie', email: 'charlie@example.com', age: 35 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    );
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
  });

  it('renders data rows', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    );
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
  });

  it('shows empty message when no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
        emptyMessage="No users found"
      />
    );
    // DataTable renders both a desktop table view and mobile card view, both showing the empty message
    const emptyMessages = screen.getAllByText('No users found');
    expect(emptyMessages.length).toBeGreaterThan(0);
  });

  it('shows loading skeletons when isLoading is true', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} keyExtractor={(row) => row.id} isLoading />
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('filters data when searchable and searchFilter provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        searchable
        searchFilter={(row, q) => row.name.toLowerCase().includes(q)}
      />
    );
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'alice' } });
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        onRowClick={onRowClick}
      />
    );
    const aliceRows = screen.getAllByText('Alice');
    fireEvent.click(aliceRows[0].closest('tr')!);
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('sorts ascending by name on header click', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} />
    );
    // Click Name column header to sort
    const nameHeaders = screen.getAllByText('Name');
    fireEvent.click(nameHeaders[0]);
    // After asc sort Alice (30), Bob (25), Charlie (35) -> alphabetically Alice < Bob < Charlie
    const cells = screen.getAllByRole('gridcell');
    // Alice should appear first in the sorted rows
    const textContent = cells.map((c) => c.textContent || '');
    const aliceIdx = textContent.findIndex((t) => t === 'Alice');
    const bobIdx = textContent.findIndex((t) => t === 'Bob');
    expect(aliceIdx).toBeLessThan(bobIdx);
  });

  it('renders toolbar when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        toolbar={<button>Export</button>}
      />
    );
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('shows pagination controls', () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(row) => row.id} pageSize={2} />
    );
    // pagination shows "1–2 of 3"
    expect(screen.getByText(/1–2 of 3/)).toBeInTheDocument();
  });

  it('renders rowActions for each row', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        rowActions={(row) => <button>Edit {row.name}</button>}
      />
    );
    expect(screen.getAllByText(/Edit/).length).toBeGreaterThan(0);
  });
});
