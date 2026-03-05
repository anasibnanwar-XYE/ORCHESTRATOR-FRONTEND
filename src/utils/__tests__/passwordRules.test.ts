/**
 * Tests for src/utils/passwordRules.ts
 *
 * Covers:
 *  - Individual rule tests
 *  - checkPasswordRules (returns record of rule results)
 *  - isPasswordValid (all rules pass)
 */

import { describe, it, expect } from 'vitest';
import { PASSWORD_RULES, checkPasswordRules, isPasswordValid } from '../passwordRules';

describe('PASSWORD_RULES', () => {
  it('has exactly 5 rules', () => {
    expect(PASSWORD_RULES).toHaveLength(5);
  });

  it('defines ids: length, uppercase, lowercase, digit, special', () => {
    const ids = PASSWORD_RULES.map((r) => r.id);
    expect(ids).toContain('length');
    expect(ids).toContain('uppercase');
    expect(ids).toContain('lowercase');
    expect(ids).toContain('digit');
    expect(ids).toContain('special');
  });

  describe('length rule', () => {
    const rule = PASSWORD_RULES.find((r) => r.id === 'length')!;
    it('fails for 9 chars', () => expect(rule.test('Abcdefgh1')).toBe(false));
    it('passes for 10 chars', () => expect(rule.test('Abcdefgh1!')).toBe(true));
  });

  describe('uppercase rule', () => {
    const rule = PASSWORD_RULES.find((r) => r.id === 'uppercase')!;
    it('fails for all lowercase', () => expect(rule.test('abcdef')).toBe(false));
    it('passes with at least one uppercase', () => expect(rule.test('Abcdef')).toBe(true));
  });

  describe('lowercase rule', () => {
    const rule = PASSWORD_RULES.find((r) => r.id === 'lowercase')!;
    it('fails for all uppercase', () => expect(rule.test('ABCDEF')).toBe(false));
    it('passes with at least one lowercase', () => expect(rule.test('ABCDEf')).toBe(true));
  });

  describe('digit rule', () => {
    const rule = PASSWORD_RULES.find((r) => r.id === 'digit')!;
    it('fails for no digits', () => expect(rule.test('Abcdefgh!')).toBe(false));
    it('passes with at least one digit', () => expect(rule.test('Abcdef1!')).toBe(true));
  });

  describe('special rule', () => {
    const rule = PASSWORD_RULES.find((r) => r.id === 'special')!;
    it('fails for no special chars', () => expect(rule.test('Abcdefgh1')).toBe(false));
    it('passes with !', () => expect(rule.test('Abcdefgh1!')).toBe(true));
    it('passes with @', () => expect(rule.test('Abcdefgh1@')).toBe(true));
    it('passes with #', () => expect(rule.test('Abcdefgh1#')).toBe(true));
  });
});

describe('checkPasswordRules', () => {
  it('returns all false for empty string', () => {
    const result = checkPasswordRules('');
    expect(result.length).toBe(false);
    expect(result.uppercase).toBe(false);
    expect(result.lowercase).toBe(false);
    expect(result.digit).toBe(false);
    expect(result.special).toBe(false);
  });

  it('returns partial results for weak password', () => {
    // "Abcdefgh1" — passes uppercase, lowercase, digit but fails length and special
    const result = checkPasswordRules('Abcdefgh1');
    expect(result.length).toBe(false);
    expect(result.uppercase).toBe(true);
    expect(result.lowercase).toBe(true);
    expect(result.digit).toBe(true);
    expect(result.special).toBe(false);
  });

  it('returns all true for strong password', () => {
    const result = checkPasswordRules('Abcdefgh1!');
    expect(result.length).toBe(true);
    expect(result.uppercase).toBe(true);
    expect(result.lowercase).toBe(true);
    expect(result.digit).toBe(true);
    expect(result.special).toBe(true);
  });
});

describe('isPasswordValid', () => {
  it('returns false for weak password (missing special)', () => {
    expect(isPasswordValid('Abcdefgh1')).toBe(false);
  });

  it('returns false for missing uppercase', () => {
    expect(isPasswordValid('abcdefgh1!')).toBe(false);
  });

  it('returns false for too short', () => {
    expect(isPasswordValid('Ab1!')).toBe(false);
  });

  it('returns true for fully compliant password', () => {
    expect(isPasswordValid('Abcdefgh1!')).toBe(true);
  });

  it('returns true for another compliant password', () => {
    expect(isPasswordValid('MyP@ssword123')).toBe(true);
  });
});
