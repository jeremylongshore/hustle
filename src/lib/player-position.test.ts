import { describe, it, expect } from 'vitest';
import {
  legacyPositionFromPrimaryPosition,
  primaryPositionFromLegacyPosition,
} from '@/lib/player-position';
import type { SoccerPositionCode } from '@/types/domain';

describe('legacyPositionFromPrimaryPosition', () => {
  it('maps GK to Goalkeeper', () => {
    expect(legacyPositionFromPrimaryPosition('GK')).toBe('Goalkeeper');
  });

  it('maps CB to Defender', () => {
    expect(legacyPositionFromPrimaryPosition('CB')).toBe('Defender');
  });

  it('maps RB to Defender', () => {
    expect(legacyPositionFromPrimaryPosition('RB')).toBe('Defender');
  });

  it('maps LB to Defender', () => {
    expect(legacyPositionFromPrimaryPosition('LB')).toBe('Defender');
  });

  it('maps RWB to Defender', () => {
    expect(legacyPositionFromPrimaryPosition('RWB')).toBe('Defender');
  });

  it('maps LWB to Defender', () => {
    expect(legacyPositionFromPrimaryPosition('LWB')).toBe('Defender');
  });

  it('maps DM to Midfielder', () => {
    expect(legacyPositionFromPrimaryPosition('DM')).toBe('Midfielder');
  });

  it('maps CM to Midfielder', () => {
    expect(legacyPositionFromPrimaryPosition('CM')).toBe('Midfielder');
  });

  it('maps AM to Midfielder', () => {
    expect(legacyPositionFromPrimaryPosition('AM')).toBe('Midfielder');
  });

  it('maps RW to Forward', () => {
    expect(legacyPositionFromPrimaryPosition('RW')).toBe('Forward');
  });

  it('maps LW to Forward', () => {
    expect(legacyPositionFromPrimaryPosition('LW')).toBe('Forward');
  });

  it('maps ST to Forward', () => {
    expect(legacyPositionFromPrimaryPosition('ST')).toBe('Forward');
  });

  it('maps CF to Forward', () => {
    expect(legacyPositionFromPrimaryPosition('CF')).toBe('Forward');
  });

  it('falls back to Midfielder for an unknown position code', () => {
    // Cast to SoccerPositionCode to test the fallback path
    expect(legacyPositionFromPrimaryPosition('FWD' as SoccerPositionCode)).toBe('Midfielder');
  });
});

describe('primaryPositionFromLegacyPosition', () => {
  it('maps Goalkeeper to GK', () => {
    expect(primaryPositionFromLegacyPosition('Goalkeeper')).toBe('GK');
  });

  it('maps Defender to CB', () => {
    expect(primaryPositionFromLegacyPosition('Defender')).toBe('CB');
  });

  it('maps Forward to ST', () => {
    expect(primaryPositionFromLegacyPosition('Forward')).toBe('ST');
  });

  it('maps Midfielder to CM', () => {
    expect(primaryPositionFromLegacyPosition('Midfielder')).toBe('CM');
  });

  it('falls back to CM for an unknown string', () => {
    expect(primaryPositionFromLegacyPosition('Winger')).toBe('CM');
  });

  it('falls back to CM for an empty string', () => {
    expect(primaryPositionFromLegacyPosition('')).toBe('CM');
  });
});
