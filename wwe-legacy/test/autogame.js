import { Game } from '../src/game.js';
// Test double: resolves any pending story situation automatically (first enabled choice) so
// flow tests can focus on matches, titles and persistence.
export class AutoGame extends Game {
  _blockedByScenario() {
    let guard = 0;
    while (this.career.flags.scenario && guard++ < 10) {
      const inst = this.career.flags.scenario;
      this.resolveScenario(inst.choices.find((c) => c.enabled).id);
    }
  }
}
export { Game };
