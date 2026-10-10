import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SlotInfo } from '@fu/engine';
import { deleteSlot, firstFreeSlot, loadSlot, notify, refreshSlots, saveNow, useGame } from '../state/gameStore';
import { useSettings } from '../state/settings';
import { getSaveStore } from '../state/storeHost';
import { exportTextFile, pickTextFile } from '../core/files';
import { useI18n } from '../i18n/useI18n';
import { Screen, Banner, Card, Empty, Section, Spinner } from '../ui/Layout';
import { Button, Field, Switch } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { Txt } from '../ui/Txt';
import { Icon } from '../ui/Icon';
import { seasonLabelOf } from '../core/format';
import { spacing } from '../theme/tokens';

type Dialog = { kind: 'rename' | 'delete' | 'overwrite' | 'saveNew' | 'verify'; slot?: SlotInfo } | null;

export default function Saves(): ReactNode {
  const { t, num, date, clock, dig } = useI18n();
  const router = useRouter();
  const slots = useGame((s) => s.slots);
  const active = useGame((s) => s.activeSlot);
  const hasWorld = useGame((s) => s.hasWorld);
  const busy = useGame((s) => s.busy);
  const saveState = useGame((s) => s.saveState);
  const autosave = useSettings((s) => s.autosave);
  const update = useSettings((s) => s.update);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState('');
  const [verifyText, setVerifyText] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [working, setWorking] = useState(false);
  useEffect(() => { void refreshSlots(); }, []);

  const guard = async (fn: () => Promise<void>): Promise<void> => {
    setWorking(true);
    try { await fn(); } catch (e) { notify('error', 'notice.opFailed', undefined, (e as Error).message); } finally { setWorking(false); }
  };
  const open = (d: Dialog, initial = ''): void => { setName(initial); setVerifyText(null); setDialog(d); };
  const close = (): void => setDialog(null);

  const doLoad = (s: SlotInfo): Promise<void> => guard(async () => { if (await loadSlot(s.slot)) router.replace('/'); });
  const doExport = (s: SlotInfo): Promise<void> => guard(async () => {
    const doc = await getSaveStore().exportSlot(s.slot);
    await exportTextFile(`football-universe-slot${s.slot}.json`, doc);
    notify('info', 'saves.exported');
  });
  const doImport = (): Promise<void> => guard(async () => {
    const text = await pickTextFile();
    if (!text) return;
    const slot = firstFreeSlot(slots);
    if (slot === null) { notify('error', 'notice.noFreeSlot'); return; }
    await getSaveStore().importSlot(slot, `Imported ${slot}`, text);
    await refreshSlots();
    notify('info', 'saves.imported');
  });
  const doVerify = (s: SlotInfo): Promise<void> => guard(async () => {
    const v = await getSaveStore().verify(s.slot);
    setVerifyText({ ok: v.ok, lines: v.revisions.map((r) => `r${r.revision}: ${r.ok ? 'OK' : r.error}`) });
    open({ kind: 'verify', slot: s });
    setVerifyText({ ok: v.ok, lines: v.revisions.map((r) => `r${r.revision}: ${r.ok ? 'OK' : r.error}`) });
  });

  return (
    <Screen back title={t('nav.saves')} testID="screen-saves">
      {busy === 'loading' || working ? <Spinner label={t('common.working')} /> : null}
      <Card>
        <Switch label={t('saves.autosave')} hint={t('saves.autosaveHint')} value={autosave} onChange={(v) => update({ autosave: v })} testID="switch-autosave" />
        {saveState.status === 'saved' ? <Txt variant="caption" color="success" testID="save-status">{t('saves.savedAt', { time: clock(saveState.at) })}</Txt> : null}
        {saveState.status === 'error' ? <Banner tone="error" text={t('notice.saveFailed')} detail={saveState.message} /> : null}
      </Card>
      {hasWorld ? (
        <View style={{ gap: spacing.sm }}>
          <Button label={t('saves.saveNow')} icon="save" onPress={() => void saveNow()} disabled={active === null} testID="btn-save-active" />
          <Button label={t('saves.saveNew')} variant="secondary" onPress={() => open({ kind: 'saveNew' }, '')} testID="btn-save-new" />
        </View>
      ) : null}
      <Section title={t('saves.slots')}>
        {slots.length === 0 ? <Empty text={t('saves.none')} icon="save" /> : slots.map((s) => (
          <Card key={s.slot} testID={`slot-${s.slot}`} accent={s.slot === active ? undefined : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="save" size={20} />
              <View style={{ flex: 1 }}>
                <Txt variant="title" numberOfLines={2}>{s.name}{s.slot === active ? ` · ${t('saves.active')}` : ''}</Txt>
                <Txt variant="small" color="muted">{s.clubName ?? ''} · {dig(seasonLabelOf(s.season))} · {t('saves.revision', { n: num(s.revision) })} · {num(s.bytes / 1024 / 1024, 1)} MB</Txt>
                <Txt variant="caption" color="muted">{t('saves.updated')}: {date(s.updatedAt.slice(0, 10))} {clock(s.updatedAt)}</Txt>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              <Button label={t('saves.load')} small onPress={() => void doLoad(s)} testID={`slot-load-${s.slot}`} />
              {hasWorld ? <Button label={t('saves.overwrite')} small variant="secondary" onPress={() => open({ kind: 'overwrite', slot: s })} testID={`slot-overwrite-${s.slot}`} /> : null}
              <Button label={t('saves.rename')} small variant="secondary" onPress={() => open({ kind: 'rename', slot: s }, s.name)} testID={`slot-rename-${s.slot}`} />
              <Button label={t('saves.export')} small variant="secondary" onPress={() => void doExport(s)} testID={`slot-export-${s.slot}`} />
              <Button label={t('saves.verify')} small variant="secondary" onPress={() => void doVerify(s)} testID={`slot-verify-${s.slot}`} />
              <Button label={t('saves.delete')} small variant="danger" onPress={() => open({ kind: 'delete', slot: s })} testID={`slot-delete-${s.slot}`} />
            </View>
          </Card>
        ))}
      </Section>
      <Button label={t('saves.import')} variant="ghost" icon="upload" onPress={() => void doImport()} testID="btn-import" />

      <Sheet visible={dialog?.kind === 'rename'} title={t('saves.rename')} onClose={close} testID="sheet-rename"
        footer={<Button label={t('common.save')} testID="btn-confirm-rename" onPress={() => guard(async () => { if (dialog?.slot && name.trim()) { await getSaveStore().renameSlot(dialog.slot.slot, name.trim()); if (active === dialog.slot.slot) useGame.setState({ slotName: name.trim() }); await refreshSlots(); } close(); })} />}>
        <Field label={t('saves.name')} value={name} onChangeText={setName} testID="input-slot-name" />
      </Sheet>
      <Sheet visible={dialog?.kind === 'saveNew'} title={t('saves.saveNew')} onClose={close} testID="sheet-save-new"
        footer={<Button label={t('common.save')} testID="btn-confirm-save-new" onPress={() => guard(async () => { const slot = firstFreeSlot(slots); if (slot === null) { notify('error', 'notice.noFreeSlot'); return; } if (await saveNow({ slot, name: name.trim() || `Save ${slot}` })) close(); })} />}>
        <Field label={t('saves.name')} value={name} onChangeText={setName} testID="input-new-name" />
      </Sheet>
      <Sheet visible={dialog?.kind === 'overwrite'} title={t('saves.overwrite')} onClose={close} testID="sheet-overwrite"
        footer={<><Button label={t('saves.overwrite')} variant="danger" testID="btn-confirm-overwrite" onPress={() => guard(async () => { if (dialog?.slot && await saveNow({ slot: dialog.slot.slot, name: dialog.slot.name })) close(); })} /><Button label={t('common.cancel')} variant="secondary" onPress={close} /></>}>
        <Txt variant="body">{t('saves.overwriteWarn', { name: dialog?.slot?.name ?? '' })}</Txt>
      </Sheet>
      <Sheet visible={dialog?.kind === 'delete'} title={t('saves.delete')} onClose={close} testID="sheet-delete"
        footer={<><Button label={t('saves.delete')} variant="danger" testID="btn-confirm-delete" onPress={() => guard(async () => { if (dialog?.slot) await deleteSlot(dialog.slot.slot); close(); })} /><Button label={t('common.cancel')} variant="secondary" onPress={close} /></>}>
        <Txt variant="body">{t('saves.deleteWarn', { name: dialog?.slot?.name ?? '' })}</Txt>
      </Sheet>
      <Sheet visible={dialog?.kind === 'verify'} title={t('saves.verify')} onClose={close} testID="sheet-verify">
        {verifyText ? <Banner tone={verifyText.ok ? 'success' : 'error'} text={verifyText.ok ? t('saves.verifyOk') : t('saves.verifyBad')} detail={verifyText.lines.join('\n')} testID="verify-result" /> : null}
      </Sheet>
    </Screen>
  );
}
