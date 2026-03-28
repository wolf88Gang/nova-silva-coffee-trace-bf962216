import { describe, expect, it } from 'vitest';
import { isUuidOrganizationId } from '@/lib/ensureDemoUser';

describe('isUuidOrganizationId', () => {
  it('returns false for demo slugs', () => {
    expect(isUuidOrganizationId('farm_demo')).toBe(false);
    expect(isUuidOrganizationId('coop_demo')).toBe(false);
  });

  it('returns true for canonical UUID organization ids', () => {
    expect(isUuidOrganizationId('00000000-0000-0000-0000-000000000001')).toBe(true);
  });

  it('returns false for empty values', () => {
    expect(isUuidOrganizationId(undefined)).toBe(false);
    expect(isUuidOrganizationId(null)).toBe(false);
    expect(isUuidOrganizationId('')).toBe(false);
  });
});