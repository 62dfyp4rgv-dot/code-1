import { loadData } from './sim/data.js';
import { App } from './ui/app.js';
import { country } from './ui/screens/country.js';
import { diplomacy, dipTarget } from './ui/screens/diplomacy.js';
import { nation } from './ui/screens/nation.js';
import { economy } from './ui/screens/economy.js';
import { military, force, peace } from './ui/screens/military.js';
import { research } from './ui/screens/research.js';
import { intel, intelTarget } from './ui/screens/intel.js';
import { inbox } from './ui/screens/inbox.js';
import { stats, objectives } from './ui/screens/stats.js';
import { more, settings, saves, help } from './ui/screens/more.js';
import { advisor } from './ui/screens/advisor.js';
import { sea, installFlow } from './ui/screens/flow.js';

installFlow(App);
async function boot() {
  const root = document.getElementById('app');
  root.innerHTML = '<div class="splash"><div><h1>MODERN AGE</h1><p>Loading the world…</p><div class="spinner"></div></div></div>';
  let data;
  try {
    data = await loadData((n) =>
      fetch(`data/${n}`).then((r) => {
        if (!r.ok) throw new Error(`${n}: ${r.status}`);
        return r.text();
      }),
    );
  } catch (e) {
    root.innerHTML = `<div class="splash"><div><h1>MODERN AGE</h1><p>Could not load game data (${String(e.message)}). Check your connection and reload.</p></div></div>`;
    return;
  }
  const app = new App(root, data);
  for (const [id, s] of Object.entries({
    country,
    diplomacy,
    dipTarget,
    nation,
    economy,
    military,
    force,
    peace,
    research,
    intel,
    intelTarget,
    inbox,
    stats,
    objectives,
    more,
    settings,
    saves,
    help,
    advisor,
    sea,
  }))
    app.register(id, s);
  window.__app = app; // handy for debugging and UI tests
  await app.showMainMenu();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
