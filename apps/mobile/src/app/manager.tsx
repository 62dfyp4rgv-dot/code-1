import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { clubView } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, KeyValue, ProgressBar, Row, RowGroup, Spinner } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { Crest, Avatar } from '../ui/ClubVisuals';
import { hrefs } from '../features/common';
import type { TKey } from '../i18n/translate';

const STYLES = ['youthDeveloper', 'possession', 'counterAttack', 'highPress', 'pragmatic', 'superstarBuilder', 'domesticDominance', 'continentalFocus', 'sustainable'];

export default function ManagerScreen(): ReactNode {
  const { t, td, dig } = useI18n();
  const router = useRouter();
  const id = useHumanClubId();
  const data = useWorldQuery('mgr', [id], (w) => {
    if (!id) return null;
    const cv = clubView(w, id);
    if (!cv) return null;
    const m = cv.manager ? w.managers[cv.manager.id] : undefined;
    const peers = (w.leagueMembers[cv.leagueId] ?? []).map((cid) => clubView(w, cid)).filter((c): c is NonNullable<typeof c> => !!c);
    return { cv, m, peers };
  });
  if (!data) return <Screen back title={t('nav.manager')}><Spinner /></Screen>;
  const { cv, m } = data;
  return (
    <Screen back title={t('nav.manager')} testID="screen-manager">
      <Card>
        <Row divider={false} title={cv.manager?.name ?? '–'} subtitle={t('manager.yourManager')} left={<Avatar name={cv.manager?.name ?? '?'} size={48} />} />
        <KeyValue label={t('manager.style')} value={td('philosophy.' + (cv.manager?.style ?? ''), cv.manager?.style ?? '–')} />
        <KeyValue label={t('club.reputation')} value={dig(cv.manager?.reputation ?? 0)} />
        {m ? (
          <>
            {([['manager.tactical', m.tacticalKnowledge], ['manager.manMgmt', m.manManagement], ['manager.youthEye', m.youthEye], ['manager.patience', m.patience]] as [TKey, number][]).map(([k, v]) => (
              <Card key={k} padded={false} style={{ borderWidth: 0, gap: 2 }}>
                <KeyValue label={t(k)} value={dig(v)} />
                <ProgressBar value={v / 100} height={6} label={t(k)} />
              </Card>
            ))}
          </>
        ) : null}
        <KeyValue label={t('club.philosophy')} value={td('philosophy.' + cv.philosophy, cv.philosophy)} />
        <Txt variant="small" color="muted">{td('style.' + cv.philosophy + '.d', '')}</Txt>
      </Card>
      <Section title={t('manager.aiTitle')}>
        <Card>
          <Txt variant="body">{t('manager.aiIntro')}</Txt>
          {(['transfers', 'tactics', 'finance', 'sacking', 'squad'] as const).map((k) => (
            <Card key={k} padded={false} style={{ borderWidth: 0, gap: 2 }}>
              <Txt variant="bodyStrong">{t(`manager.ai.${k}` as 'manager.ai.transfers')}</Txt>
              <Txt variant="small" color="muted">{t(`manager.ai.${k}.d` as 'manager.ai.transfers.d')}</Txt>
            </Card>
          ))}
        </Card>
      </Section>
      <Section title={t('manager.styles')}>
        <Card>
          {STYLES.map((s) => (
            <Card key={s} padded={false} style={{ borderWidth: 0, gap: 2 }}>
              <Txt variant="bodyStrong">{td('philosophy.' + s, s)}</Txt>
              <Txt variant="small" color="muted">{td('style.' + s + '.d', '')}</Txt>
            </Card>
          ))}
        </Card>
      </Section>
      <Section title={t('manager.leagueClubs')}>
        <RowGroup testID="league-clubs-ai">
          {data.peers.map((c) => (
            <Row key={c.id} title={c.name} left={<Crest clubId={c.id} name={c.name} size={28} />} subtitle={`${c.manager?.name ?? '–'} · ${td('philosophy.' + (c.manager?.style ?? ''), c.manager?.style ?? '')} · ${td('philosophy.' + c.philosophy, c.philosophy)}`} chevron onPress={() => router.push(hrefs.club(c.id))} />
          ))}
        </RowGroup>
      </Section>
    </Screen>
  );
}
