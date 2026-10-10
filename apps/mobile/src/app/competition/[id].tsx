import type { ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { competitionName, competitionShortName, COMPETITIONS } from '@fu/engine';
import { getWorld } from '../../state/worldHost';
import { Screen } from '../../ui/Layout';
import { CompetitionBody } from '../../features/CompetitionBody';
import { useI18n } from '../../i18n/useI18n';

export default function CompetitionScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const def = COMPETITIONS[id];
  const world = getWorld();
  return (
    <Screen back title={def ? (world ? competitionName(world, id) : def.name) : t('comp.notFound')} subtitle={def ? (world ? competitionShortName(world, id) : def.shortName) : undefined} testID="screen-competition">
      <CompetitionBody compId={id} />
    </Screen>
  );
}
