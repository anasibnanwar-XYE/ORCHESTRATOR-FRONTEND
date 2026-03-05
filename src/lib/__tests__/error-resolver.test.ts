/**
 * Tests for src/lib/error-resolver.ts
 *
 * Covers every documented error code and edge cases.
 */

import { describe, it, expect } from 'vitest';
import axios, { type AxiosResponse } from 'axios';
import {
  resolveError,
  getErrorMessage,
  resolveErrorCode,
  isMfaRedirectCode,
  MFA_REDIRECT,
} from '../error-resolver';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeAxiosError(code: string, message = 'backend message') {
  return new axios.AxiosError(
    'Request failed',
    '400',
    undefined,
    undefined,
    {
      status: 400,
      statusText: 'Bad Request',
      data: { success: false, code, message },
      headers: {},
      config: {} as never,
    } as unknown as AxiosResponse
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveErrorCode()
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveErrorCode', () => {
  const cases: [string, string | typeof MFA_REDIRECT][] = [
    ['AUTH_001', 'Invalid email or password'],
    ['AUTH_003', 'Session expired, please sign in again'],
    ['AUTH_004', 'You do not have access to this resource'],
    ['AUTH_005', 'Account locked, please contact your administrator'],
    ['AUTH_006', 'Account has been deactivated'],
    ['AUTH_007', MFA_REDIRECT],
    ['AUTH_008', 'Invalid verification code'],
    ['VAL_001', 'This field is required'],
    ['VAL_002', 'Invalid format — please check the value you entered'],
    ['VAL_003', 'Value is below the minimum allowed'],
    ['VAL_004', 'Value exceeds the maximum allowed'],
    ['VAL_005', 'Input length is invalid'],
    ['VAL_006', 'Selected option is not valid'],
    ['VAL_007', 'Invalid date or time value'],
    ['BUS_001', 'Cannot perform this action in the current state'],
    ['BUS_002', 'This entry already exists'],
    ['BUS_003', 'Record not found'],
    ['BUS_006', 'Credit limit exceeded'],
    ['BUS_010', 'This module is not available for your plan'],
    ['CONC_001', 'This record was modified by someone else — please refresh and try again'],
    ['SYS_001', 'Something went wrong, please try again'],
    ['SYS_002', 'Something went wrong, please try again'],
    ['SYS_003', 'Something went wrong, please try again'],
    ['SYS_004', 'Something went wrong, please try again'],
    ['SYS_005', 'Something went wrong, please try again'],
  ];

  cases.forEach(([code, expected]) => {
    it(`maps ${code} correctly`, () => {
      expect(resolveErrorCode(code)).toBe(expected);
    });
  });

  it('returns undefined for unknown codes', () => {
    expect(resolveErrorCode('UNKNOWN_999')).toBeUndefined();
    expect(resolveErrorCode('')).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isMfaRedirectCode()
// ─────────────────────────────────────────────────────────────────────────────

describe('isMfaRedirectCode', () => {
  it('returns true for AUTH_007', () => {
    expect(isMfaRedirectCode('AUTH_007')).toBe(true);
  });

  it('returns false for other auth codes', () => {
    expect(isMfaRedirectCode('AUTH_001')).toBe(false);
    expect(isMfaRedirectCode('AUTH_008')).toBe(false);
  });

  it('returns false for non-auth codes', () => {
    expect(isMfaRedirectCode('BUS_001')).toBe(false);
    expect(isMfaRedirectCode('SYS_001')).toBe(false);
    expect(isMfaRedirectCode('UNKNOWN')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveError()
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveError', () => {
  describe('known error codes', () => {
    it('resolves AUTH_001 to user-friendly message', () => {
      const result = resolveError(makeAxiosError('AUTH_001'));
      expect(result).toEqual({ type: 'message', message: 'Invalid email or password' });
    });

    it('resolves AUTH_003 to session expired message', () => {
      const result = resolveError(makeAxiosError('AUTH_003'));
      expect(result).toEqual({
        type: 'message',
        message: 'Session expired, please sign in again',
      });
    });

    it('resolves AUTH_004 to access denied message', () => {
      const result = resolveError(makeAxiosError('AUTH_004'));
      expect(result).toEqual({
        type: 'message',
        message: 'You do not have access to this resource',
      });
    });

    it('resolves AUTH_005 to account locked message', () => {
      const result = resolveError(makeAxiosError('AUTH_005'));
      expect(result).toEqual({
        type: 'message',
        message: 'Account locked, please contact your administrator',
      });
    });

    it('resolves AUTH_006 to account deactivated message', () => {
      const result = resolveError(makeAxiosError('AUTH_006'));
      expect(result).toEqual({
        type: 'message',
        message: 'Account has been deactivated',
      });
    });

    it('resolves AUTH_007 to mfa_redirect type', () => {
      const result = resolveError(makeAxiosError('AUTH_007'));
      expect(result).toEqual({ type: 'mfa_redirect' });
    });

    it('resolves AUTH_008 to invalid verification code message', () => {
      const result = resolveError(makeAxiosError('AUTH_008'));
      expect(result).toEqual({ type: 'message', message: 'Invalid verification code' });
    });

    it('resolves VAL_001 (required field)', () => {
      const result = resolveError(makeAxiosError('VAL_001'));
      expect(result).toEqual({ type: 'message', message: 'This field is required' });
    });

    it('resolves VAL_002 (invalid format)', () => {
      const result = resolveError(makeAxiosError('VAL_002'));
      expect(result).toEqual({
        type: 'message',
        message: 'Invalid format — please check the value you entered',
      });
    });

    it('resolves VAL_003 (below minimum)', () => {
      const result = resolveError(makeAxiosError('VAL_003'));
      expect(result).toEqual({ type: 'message', message: 'Value is below the minimum allowed' });
    });

    it('resolves VAL_004 (exceeds maximum)', () => {
      const result = resolveError(makeAxiosError('VAL_004'));
      expect(result).toEqual({ type: 'message', message: 'Value exceeds the maximum allowed' });
    });

    it('resolves VAL_005 (invalid length)', () => {
      const result = resolveError(makeAxiosError('VAL_005'));
      expect(result).toEqual({ type: 'message', message: 'Input length is invalid' });
    });

    it('resolves VAL_006 (invalid enum)', () => {
      const result = resolveError(makeAxiosError('VAL_006'));
      expect(result).toEqual({ type: 'message', message: 'Selected option is not valid' });
    });

    it('resolves VAL_007 (invalid date)', () => {
      const result = resolveError(makeAxiosError('VAL_007'));
      expect(result).toEqual({ type: 'message', message: 'Invalid date or time value' });
    });

    it('resolves BUS_001 (invalid state)', () => {
      const result = resolveError(makeAxiosError('BUS_001'));
      expect(result).toEqual({
        type: 'message',
        message: 'Cannot perform this action in the current state',
      });
    });

    it('resolves BUS_002 (duplicate entry)', () => {
      const result = resolveError(makeAxiosError('BUS_002'));
      expect(result).toEqual({ type: 'message', message: 'This entry already exists' });
    });

    it('resolves BUS_003 (not found)', () => {
      const result = resolveError(makeAxiosError('BUS_003'));
      expect(result).toEqual({ type: 'message', message: 'Record not found' });
    });

    it('resolves BUS_006 (credit limit exceeded)', () => {
      const result = resolveError(makeAxiosError('BUS_006'));
      expect(result).toEqual({ type: 'message', message: 'Credit limit exceeded' });
    });

    it('resolves BUS_010 (module not available)', () => {
      const result = resolveError(makeAxiosError('BUS_010'));
      expect(result).toEqual({
        type: 'message',
        message: 'This module is not available for your plan',
      });
    });

    it('resolves CONC_001 (concurrent modification)', () => {
      const result = resolveError(makeAxiosError('CONC_001'));
      expect(result).toEqual({
        type: 'message',
        message: 'This record was modified by someone else — please refresh and try again',
      });
    });

    it('resolves SYS_001 to generic system error', () => {
      const result = resolveError(makeAxiosError('SYS_001'));
      expect(result).toEqual({
        type: 'message',
        message: 'Something went wrong, please try again',
      });
    });

    it('resolves SYS_002 to generic system error', () => {
      const result = resolveError(makeAxiosError('SYS_002'));
      expect(result.type).toBe('message');
      expect((result as { type: 'message'; message: string }).message).toContain('Something went wrong');
    });

    it('resolves SYS_003 to generic system error', () => {
      const result = resolveError(makeAxiosError('SYS_003'));
      expect(result.type).toBe('message');
    });

    it('resolves SYS_004 to generic system error', () => {
      const result = resolveError(makeAxiosError('SYS_004'));
      expect(result.type).toBe('message');
    });

    it('resolves SYS_005 to generic system error', () => {
      const result = resolveError(makeAxiosError('SYS_005'));
      expect(result.type).toBe('message');
    });
  });

  describe('fallback behaviour', () => {
    it('uses raw API message for unknown error codes', () => {
      const error = makeAxiosError('UNKNOWN_CODE', 'Server returned specific message');
      const result = resolveError(error);
      expect(result.type).toBe('message');
      // Should fall back to the raw message since code is unknown
      expect((result as { type: 'message'; message: string }).message).toBe(
        'Server returned specific message'
      );
    });

    it('returns generic fallback for plain Error', () => {
      const result = resolveError(new Error('Something broke'));
      expect(result).toEqual({ type: 'message', message: 'Something broke' });
    });

    it('returns generic fallback for null', () => {
      const result = resolveError(null);
      expect(result.type).toBe('message');
      expect((result as { type: 'message'; message: string }).message).toBe(
        'Something went wrong, please try again'
      );
    });

    it('returns generic fallback for undefined', () => {
      const result = resolveError(undefined);
      expect(result.type).toBe('message');
    });

    it('returns generic fallback for string', () => {
      const result = resolveError('some string error');
      expect(result.type).toBe('message');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getErrorMessage()
// ─────────────────────────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  it('returns the resolved message for known codes', () => {
    const msg = getErrorMessage(makeAxiosError('AUTH_001'));
    expect(msg).toBe('Invalid email or password');
  });

  it('returns null for AUTH_007 (MFA redirect)', () => {
    const msg = getErrorMessage(makeAxiosError('AUTH_007'));
    expect(msg).toBeNull();
  });

  it('returns message for plain errors', () => {
    const msg = getErrorMessage(new Error('Test error'));
    expect(msg).toBe('Test error');
  });

  it('returns generic message for null', () => {
    const msg = getErrorMessage(null);
    expect(msg).toBe('Something went wrong, please try again');
  });
});
