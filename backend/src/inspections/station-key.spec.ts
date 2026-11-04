import { isStationUuid } from './station-key';

describe('isStationUuid', () => {
  it('recognizes canonical UUID station identifiers', () => {
    expect(isStationUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
  it('recognizes station codes as non-UUID values', () => {
    expect(isStationUuid('STA-0000001')).toBe(false);
  });
  it('does not treat malformed UUIDs as identifiers', () => {
    expect(isStationUuid('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isStationUuid('')).toBe(false);
  });
});
