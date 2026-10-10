import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { competitionList, competitionOverview } from '@fu/engine';
import { useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Row, Section, Banner, Spinner, Empty } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { hrefs } from '../features/common';
import { getWorld } from '../state/worldHost';
import type { TKey } from '../i18n/translate';

const HUBS: { code: string; title: TKey; desc: TKey }[] = [
  { code: 'UEFA', title: 'hub.UEFA', desc: 'hub.UEFA.d' }, { code: 'AFC', title: 'hub.AFC', desc: 'hub.AFC.d' }, { code: 'CAF', title: 'hub.CAF', desc: 'hub.CAF.d' },
  { code: 'CONCACAF', title: 'hub.CONCACAF', desc: 'hub.CONCACAF.d' }, { code: 'CONMEBOL', title: 'hub.CONMEBOL', desc: 'hub.CONMEBOL.d' }, { code: 'OFC', title: 'hub.OFC', desc: 'hub.OFC.d' },
  { code: 'FIFA', title: 'hub.FIFA', desc: 'hub.FIFA.d' },
];

export default function Continental(): ReactNode {
  const { t, td, dig } = useI18n();
  const router = useRouter();
  const humanId = getWorld()?.config.humanClubId ?? null;
  const data = useWorldQuery('hubs', [humanId], (w) => {
    const list = competitionList(w).filter((c) => c.kind === 'continental' || c.kind === 'intercontinental');
    return HUBS.map((h) => ({
      ...h,
      comps: list.filter((c) => (h.code === 'FIFA' ? c.kind === 'intercontinental' : c.kind === 'continental' && c.confederation === h.code)).map((c) => {
        const ov = competitionOverview(w, c.id);
        const stage = ov?.stages.find((s) => s.status === 'active') ?? ov?.stages[ov.stages.length - 1];
        return { ...c, entrants: ov?.entrants ?? 0, stage: stage?.name ?? '', winner: ov?.winner ?? null, human: !!humanId && !!w.competitions[c.id]?.entrants.includes(humanId) };
      }),
    }));
  });
  if (!data) return <Screen back title={t('nav.continental')}><Spinner /></Screen>;
  return (
    <Screen back title={t('nav.continental')} testID="screen-continental">
      <Banner tone="warn" text={t('verify.banner')} />
      {data.map((h) => (
        <Section key={h.code} title={t(h.title)} testID={`hub-${h.code}`}>
          <Card padded={false}>
            <Txt variant="small" color="muted" style={{ padding: 12, paddingBottom: 4 }}>{t(h.desc)}</Txt>
            {h.comps.length === 0 ? <Empty text={t('hub.none')} /> : h.comps.map((c, i) => (
              <Row key={c.id} testID={`hubcomp-${c.id}`} divider={i < h.comps.length - 1} title={c.name}
                subtitle={`${td('status.' + c.status, c.status)} · ${t('comp.entrants')} ${dig(c.entrants)}${c.stage ? ` · ${c.stage}` : ''}${c.winner ? ` · ${t('comp.winner')}: ${c.winner}` : ''}${c.human ? ` · ${t('hub.yourClubIn')}` : ''}`}
                chevron onPress={() => router.push(hrefs.competition(c.id))} />
            ))}
          </Card>
        </Section>
      ))}
    </Screen>
  );
}
