import { esc } from '../fmt.js';
import { icon } from '../icons.js';
import { tag, note } from './util.js';
import { advise } from '../../sim/advisor.js';

const SEV = { bad: ['Urgent', 'bad'], warn: ['Watch', 'warn'], info: ['Idea', ''], good: ['Good', 'good'] };

export const advisor = {
  render(app) {
    const items = advise(app.sim);
    let h = note('Your advisor reads the numbers and suggests what to look at next. Tap an item to open the right screen.');
    for (const a of items) {
      const [label, cls] = SEV[a.sev];
      const attrs = `data-act="advgo" data-open-id="${esc(a.open)}" data-go-tab="${esc(a.tab || '')}"`;
      h += `<div class="li" ${attrs} role="button" tabindex="0"><div class="grow"><div class="t">${esc(a.title)}</div><div class="s">${esc(a.text)}</div></div><div class="end">${tag(label, cls)}</div>${icon('right', 'mu', 16)}</div>`;
    }
    return { title: 'Advisor', sub: esc(app.sim.player.name), html: h };
  },
  actions: {
    advgo: (app, el) => {
      const id = el.dataset.openId;
      const tab = el.dataset.goTab;
      if (id === 'dipTarget') return app.openSheet('dipTarget', { id: +tab });
      if (tab) app.sheetTab[id] = tab;
      app.openSheet(id);
    },
  },
};
export const advisorCount = (sim) => advise(sim).filter((a) => a.sev === 'bad' || a.sev === 'warn').length;
