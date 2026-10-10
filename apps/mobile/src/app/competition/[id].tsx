import type { ReactNode } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { COMPETITIONS } from '@fu/engine';
import { Screen } from '../../ui/Layout';
import { CompetitionBody } from '../../features/CompetitionBody';
import { useI18n } from '../../i18n/useI18n';

export default function CompetitionScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const def = COMPETITIONS[id];
  return (
    <Screen back title={def?.name ?? t('comp.notFound')} subtitle={def?.shortName} testID="screen-competition">
      <CompetitionBody compId={id} />
    </Screen>
  );
}
