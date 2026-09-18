import type { SoccerPositionCode } from '@/types/domain';

export type LegacyPositionCategory = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';

const DEFENDER_POSITIONS: SoccerPositionCode[] = ['CB', 'RB', 'LB', 'RWB', 'LWB'];
const MIDFIELDER_POSITIONS: SoccerPositionCode[] = ['DM', 'CM', 'AM'];
const FORWARD_POSITIONS: SoccerPositionCode[] = ['RW', 'LW', 'ST', 'CF'];

export function legacyPositionFromPrimaryPosition(primary: SoccerPositionCode): LegacyPositionCategory {
  if (primary === 'GK') return 'Goalkeeper';
  if (DEFENDER_POSITIONS.includes(primary)) return 'Defender';
  if (MIDFIELDER_POSITIONS.includes(primary)) return 'Midfielder';
  if (FORWARD_POSITIONS.includes(primary)) return 'Forward';
  return 'Midfielder';
}

export function primaryPositionFromLegacyPosition(legacy: string): SoccerPositionCode {
  switch (legacy) {
    case 'Goalkeeper':
      return 'GK';
    case 'Defender':
      return 'CB';
    case 'Forward':
      return 'ST';
    case 'Midfielder':
    default:
      return 'CM';
  }
}

