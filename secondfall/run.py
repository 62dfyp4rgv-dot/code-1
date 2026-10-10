import os, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from secondfall.registry import render_panel
panels = {p['n']: p for p in json.load(open('panels.json'))}
S = float(sys.argv[1]); ns = [int(x) for x in sys.argv[2:]]
for n in ns:
    p = panels[n]
    print(render_panel(n, p['w'], p['h'], S, out_dir=os.environ.get('SF_OUT','out')), flush=True)
