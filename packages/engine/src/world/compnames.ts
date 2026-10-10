import { COMPETITIONS } from '../competition/registry';
import type { WorldState } from './types';

/** Display name of a competition: a data-pack override if one was applied, else the registry's own name. */
export function competitionName(world: WorldState, id: string): string {
  const o = world.overrides.competitionNames;
  if (o && Object.hasOwn(o, id)) return (o[id] as { name: string }).name;
  return COMPETITIONS[id]?.name ?? id;
}

export function competitionShortName(world: WorldState, id: string): string {
  const o = world.overrides.competitionNames;
  if (o && Object.hasOwn(o, id)) return (o[id] as { shortName: string }).shortName;
  return COMPETITIONS[id]?.shortName ?? id;
}
