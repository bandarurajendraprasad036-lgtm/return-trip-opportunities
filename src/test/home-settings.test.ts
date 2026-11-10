import { describe, expect, it } from 'vitest';
import { DEFAULT_HOME_SETTINGS, parseHomeSettings } from '@/lib/home-settings';

describe('home settings', () => {
  it('keeps both top boxes and all main sections visible by default', () => {
    expect(DEFAULT_HOME_SETTINGS).toMatchObject({ showAdminChat: true, showLocation: true, showVehicles: true, showJobs: true });
  });
  it('uses admin-supplied public locations and box choices', () => {
    const parsed = parseHomeSettings(JSON.stringify({ fromLocation: 'హైదరాబాద్', toLocation: 'విజయవాడ', showServices: false }));
    expect(parsed.fromLocation).toBe('హైదరాబాద్');
    expect(parsed.toLocation).toBe('విజయవాడ');
    expect(parsed.showServices).toBe(false);
    expect(parsed.showJobs).toBe(true);
  });
  it('falls back safely when stored settings are invalid', () => {
    expect(parseHomeSettings('{broken')).toEqual(DEFAULT_HOME_SETTINGS);
    expect(parseHomeSettings(JSON.stringify({ showJobs: 'yes' }))).toEqual(DEFAULT_HOME_SETTINGS);
  });
});
