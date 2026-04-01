import type { AccountDto } from './accountingApi';

export function requiresSupplierContextAccount(
  account: Pick<AccountDto, 'code' | 'name'> | null | undefined,
): boolean {
  if (!account) return false;

  const code = account.code.trim().toUpperCase();
  const name = account.name.trim().toLowerCase();

  return (
    code === 'AP' ||
    code.startsWith('AP-') ||
    code.startsWith('AP_') ||
    name.includes('accounts payable') ||
    name.includes('supplier payable') ||
    name.includes('trade payable')
  );
}
