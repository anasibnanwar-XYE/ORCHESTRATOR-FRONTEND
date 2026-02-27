
export const accountingPortalSteps = [
    {
        element: 'aside nav',
        intro: 'Use this sidebar to navigate between different accounting modules like Journals, Ledgers, and Invoices.',
        position: 'right',
        title: 'Navigation',
    },
    {
        element: '#dealer-switcher',
        intro: 'Switch between different dealers to view their specific data.',
        position: 'bottom',
        title: 'Dealer Switcher',
    },
    {
        element: '#date-range-picker',
        intro: 'Filter data by a specific date range.',
        position: 'bottom',
        title: 'Date Range',
    },
    {
        element: '#global-search',
        intro: 'Quickly search for accounts, invoices, or other records across the portal.',
        position: 'bottom',
        title: 'Global Search',
    },
    {
        element: '#command-palette-btn',
        intro: 'Open the Command Palette (Ctrl+K) to jump to any page instantly.',
        position: 'bottom',
        title: 'Command Palette',
    },
];

export const journalPageSteps = [
    {
        element: '#journal-new-entry-btn',
        intro: 'Click here to create a new manual journal entry.',
        position: 'bottom',
        title: 'New Entry',
    },
    {
        element: '#journal-totals',
        intro: 'View the total Debit and Credit amounts for the current view.',
        position: 'bottom',
        title: 'Totals',
    },
    {
        element: '#journal-filters',
        intro: 'Filter entries by text, status (Draft/Posted), or amount range.',
        position: 'bottom',
        title: 'Filters',
    },
    {
        element: '#journal-export-csv',
        intro: 'Export the current list of journal entries to a CSV file.',
        position: 'bottom',
        title: 'Export',
    },
];

export const adminPortalSteps = [
    {
        element: 'aside nav',
        intro: 'Navigate through different administrative modules like User Management, Roles, and HR.',
        position: 'right',
        title: 'Admin Navigation',
    },
    {
        element: '#theme-toggle',
        intro: 'Switch between Dark and Light modes.',
        position: 'bottom',
        title: 'Theme',
    },
    {
        element: '#user-menu',
        intro: 'Access your profile, settings, or sign out.',
        position: 'bottom',
        title: 'User Menu',
    },
];

export const dealerPortalSteps = [
    {
        element: 'aside nav',
        intro: 'Access dealer-specific tools like Orders, Inventory, and Payments.',
        position: 'right',
        title: 'Dealer Navigation',
    },
    {
        element: '#dealer-profile',
        intro: 'View and manage your dealer profile and settings.',
        position: 'bottom',
        title: 'Profile',
    },
];

export const factoryPortalSteps = [
    {
        element: 'aside nav',
        intro: 'Manage production, inventory, and factory operations.',
        position: 'right',
        title: 'Factory Navigation',
    },
    {
        element: '#production-status',
        intro: 'Check the current status of production lines.',
        position: 'bottom',
        title: 'Production Status',
    },
];

export const salesPortalSteps = [
    {
        element: 'aside nav',
        intro: 'Track sales, manage leads, and view performance reports.',
        position: 'right',
        title: 'Sales Navigation',
    },
    {
        element: '#sales-targets',
        intro: 'View your current progress against sales targets.',
        position: 'bottom',
        title: 'Targets',
    },
];

export const journalEntryFormSteps = [
    {
        element: '#journal-form-ref',
        intro: 'Enter a unique reference number (e.g., Cheque No, Invoice ID). This helps in tracking and auditing the transaction later.',
        position: 'right',
        title: 'Reference',
    },
    {
        element: '#journal-form-date',
        intro: 'Select the date for this transaction. This determines the accounting period it falls into.',
        position: 'right',
        title: 'Date',
    },
    {
        element: '#journal-form-dealer',
        intro: 'Optional: Link this entry to a specific dealer. This is crucial for maintaining accurate dealer sub-ledgers.',
        position: 'left',
        title: 'Dealer',
    },
    {
        element: '#journal-form-voucher',
        intro: 'Choose the voucher type. Use "Journal" for adjustments, "Contra" for bank transfers, "Receipt" for incoming money, and "Payment" for outgoing.',
        position: 'left',
        title: 'Voucher Type',
    },
    {
        element: '#journal-form-lines',
        intro: 'Add your debit and credit lines here. You must have at least one debit and one credit, and the totals must match perfectly.',
        position: 'top',
        title: 'Lines',
    },
    {
        element: '#journal-form-save',
        intro: 'Once balanced, click Post. Note: Posted entries cannot be edited, only reversed, to ensure audit trail integrity.',
        position: 'left',
        title: 'Post',
    },
];

export const createOrderSteps = [
    {
        element: '#order-dealer',
        intro: 'Start by selecting the Dealer. This is required to determine the correct pricing tier and tax configuration for the order.',
        position: 'right',
        title: 'Select Dealer',
    },
    {
        element: '#order-payment',
        intro: 'Choose how this order is paid. "Credit" creates an invoice. "Cash" or "Split" allows you to record immediate payments against cash accounts.',
        position: 'right',
        title: 'Payment Method',
    },
    {
        element: '#order-gst',
        intro: 'Configure GST application. Use "Per Item" for products with different tax rates, or "Order Total" for a flat rate across the board.',
        position: 'left',
        title: 'GST Configuration',
    },
    {
        element: '#order-items',
        intro: 'Add products to the order. Search by name or SKU. The system will auto-fill the base price, but you can override it if authorized.',
        position: 'top',
        title: 'Order Items',
    },
    {
        element: '#order-submit',
        intro: 'Book the demand. This creates a "Booked" order and notifies the factory to schedule production if inventory is insufficient.',
        position: 'left',
        title: 'Book Demand',
    },
];

export const productionPlanSteps = [
    {
        element: '#plan-number',
        intro: 'Assign a unique Plan Number. This ID will be used to track this specific production run through the factory floor.',
        position: 'right',
        title: 'Plan Number',
    },
    {
        element: '#plan-product',
        intro: 'Specify the Product to be manufactured. Ensure this matches the exact SKU required by pending orders.',
        position: 'right',
        title: 'Product',
    },
    {
        element: '#plan-qty',
        intro: 'Set the target Quantity. This should align with your current capacity and pending demand.',
        position: 'left',
        title: 'Quantity',
    },
    {
        element: '#plan-date',
        intro: 'Set the target completion date. This helps in prioritizing tasks on the floor.',
        position: 'left',
        title: 'Target Date',
    },
    {
        element: '#plan-save',
        intro: 'Create the plan. It will start in "Planned" status and can be moved to "In Progress" when work begins.',
        position: 'left',
        title: 'Create Plan',
    },


];

export const accountingDashboardSteps = [
    {
        element: '#acct-kpi-cards',
        intro: 'View key financial metrics like Total Assets, Liabilities, Equity, and Net Income at a glance.',
        position: 'bottom',
        title: 'Financial Overview',
    },
    {
        element: '#acct-recent-postings',
        intro: 'Track the most recent journal entries posted to the system.',
        position: 'left',
        title: 'Recent Activity',
    },
    {
        element: '#acct-quick-stats',
        intro: 'Monitor Working Capital and top account balances.',
        position: 'left',
        title: 'Quick Stats',
    },
];

export const accountsSteps = [
    {
        element: '#accounts-list',
        intro: 'View your Chart of Accounts. You can filter by type (Asset, Liability, Equity, Income, Expense).',
        position: 'top',
        title: 'Chart of Accounts',
    },
    {
        element: '#accounts-filters',
        intro: 'Filter accounts by name, code, or type to quickly find what you need.',
        position: 'bottom',
        title: 'Filters',
    },
];

export const invoicesSteps = [
    {
        element: '#invoices-list',
        intro: 'Manage all customer invoices. Track status (Draft, Sent, Paid, Overdue) and view linked journal entries.',
        position: 'top',
        title: 'Invoices',
    },
];

export const paymentsSteps = [
    {
        element: '#payments-list',
        intro: 'Track all incoming payments from dealers and customers.',
        position: 'top',
        title: 'Payments',
    },
    {
        element: '#payments-receive-btn',
        intro: 'Manually record a payment received from a dealer.',
        position: 'bottom',
        title: 'Receive Payment',
    },
];

export const reportsSteps = [
    {
        element: '#reports-grid',
        intro: 'Access detailed financial reports including Balance Sheet, P&L, and Cash Flow.',
        position: 'top',
        title: 'Financial Reports',
    },
];

export const suppliersSteps = [
    {
        element: '#suppliers-list',
        intro: 'Manage your vendor and supplier database.',
        position: 'top',
        title: 'Suppliers',
    },
    {
        element: '#suppliers-add-form',
        intro: 'Onboard a new supplier to start tracking purchases.',
        position: 'bottom',
        title: 'Add Supplier',
    },
];

export const dealersSteps = [
    {
        element: '#dealers-list',
        intro: 'View all registered dealers and their current credit standing.',
        position: 'top',
        title: 'Dealers',
    },
    {
        element: '#dealers-add-form',
        intro: 'Register a new dealer and assign them a credit limit.',
        position: 'bottom',
        title: 'Onboard Dealer',
    },
];

export const userManagementSteps = [
    {
        element: '#users-list',
        intro: 'View and manage all system users.',
        position: 'top',
        title: 'Users',
    },
    {
        element: '#users-add-btn',
        intro: 'Create a new user account and assign them a role.',
        position: 'bottom',
        title: 'Add User',
    },
];

export const rolesSteps = [
    {
        element: '#roles-list',
        intro: 'Define roles and permissions to control access to different parts of the system.',
        position: 'top',
        title: 'Roles',
    },
    {
        element: '#roles-create-btn',
        intro: 'Create a new role with a custom set of permissions.',
        position: 'bottom',
        title: 'Create Role',
    },
];

export const companiesSteps = [
    {
        element: '#companies-list',
        intro: 'Manage the companies or entities within your organization.',
        position: 'top',
        title: 'Companies',
    },
    {
        element: '#companies-add-btn',
        intro: 'Register a new company entity.',
        position: 'bottom',
        title: 'Add Company',
    },
];

export const employeesSteps = [
    {
        element: '#employees-list',
        intro: 'Maintain a database of all employees, including their personal and professional details.',
        position: 'top',
        title: 'Employees',
    },
    {
        element: '#employees-add-btn',
        intro: 'Onboard a new employee.',
        position: 'bottom',
        title: 'Add Employee',
    },
];

export const payrollSteps = [
    {
        element: '#payroll-summary',
        intro: 'View a summary of the current payroll period.',
        position: 'bottom',
        title: 'Payroll Summary',
    },
    {
        element: '#payroll-run-btn',
        intro: 'Initiate a new payroll run for the week or month.',
        position: 'bottom',
        title: 'Run Payroll',
    },
];

export const operationsControlSteps = [
    {
        element: '#ops-control-panel',
        intro: 'Monitor and control critical operational parameters.',
        position: 'top',
        title: 'Operations Control',
    },
];

export const portalHubSteps = [
    {
        element: '#portal-hub-grid',
        intro: 'Central hub to access all other portals you have permission for.',
        position: 'top',
        title: 'Portal Hub',
    },
];

export const profileSteps = [
    {
        element: '#profile-details',
        intro: 'View and edit your personal profile information.',
        position: 'top',
        title: 'Profile',
    },
];

export const settingsSteps = [
    {
        element: '#settings-form',
        intro: 'Configure system-wide settings and preferences.',
        position: 'top',
        title: 'Settings',
    },
];

export const getStepsForPath = (pathname: string) => {
    if (pathname.includes('/accounting/journal')) {
        return [...accountingPortalSteps, ...journalPageSteps];
    }
    if (pathname.includes('/accounting/accounts')) {
        return [...accountingPortalSteps, ...accountsSteps];
    }
    if (pathname.includes('/accounting/invoices')) {
        return [...accountingPortalSteps, ...invoicesSteps];
    }
    if (pathname.includes('/accounting/payments')) {
        return [...accountingPortalSteps, ...paymentsSteps];
    }
    if (pathname.includes('/accounting/reports')) {
        return [...accountingPortalSteps, ...reportsSteps];
    }
    if (pathname.includes('/accounting/suppliers')) {
        return [...accountingPortalSteps, ...suppliersSteps];
    }
    if (pathname.includes('/accounting/dealers')) {
        return [...accountingPortalSteps, ...dealersSteps];
    }
    if (pathname.includes('/accounting') && (pathname.endsWith('/accounting') || pathname.endsWith('/accounting/dashboard'))) {
        return [...accountingPortalSteps, ...accountingDashboardSteps];
    }
    if (pathname.includes('/accounting')) {
        return accountingPortalSteps;
    }
    if (pathname.includes('/admin/users')) {
        return [...adminPortalSteps, ...userManagementSteps];
    }
    if (pathname.includes('/admin/roles')) {
        return [...adminPortalSteps, ...rolesSteps];
    }
    if (pathname.includes('/admin/companies')) {
        return [...adminPortalSteps, ...companiesSteps];
    }
    if (pathname.includes('/admin/employees')) {
        return [...adminPortalSteps, ...employeesSteps];
    }
    if (pathname.includes('/admin/payroll')) {
        return [...adminPortalSteps, ...payrollSteps];
    }
    if (pathname.includes('/admin/operations')) {
        return [...adminPortalSteps, ...operationsControlSteps];
    }
    if (pathname.includes('/admin/hub')) {
        return [...adminPortalSteps, ...portalHubSteps];
    }
    if (pathname.includes('/admin/profile')) {
        return [...adminPortalSteps, ...profileSteps];
    }
    if (pathname.includes('/admin/settings')) {
        return [...adminPortalSteps, ...settingsSteps];
    }
    if (pathname.includes('/admin') || pathname === '/dashboard' || pathname === '/users' || pathname === '/roles' || pathname.includes('/hr')) {
        return adminPortalSteps;
    }
    if (pathname.includes('/dealer')) {
        return dealerPortalSteps;
    }
    if (pathname.includes('/factory')) {
        return factoryPortalSteps;
    }
    if (pathname.includes('/sales')) {
        return salesPortalSteps;
    }

    // Default fallback
    return [];
};
