"""Build the complete offline viewer and GitHub Pages assets, with no CDN."""
from pathlib import Path
import shutil
import json
import base64
from wall_junctions import junction_fills

SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parent
OUTPUT = ROOT / 'docs'
OUTPUT.mkdir(exist_ok=True)
html = (SOURCE / 'house.template.html').read_text(encoding='utf-8')
html = html.replace('/*__FALLBACK_PLAN__*/', (ROOT/'plans/restored-floor-plan.svg').read_text(encoding='utf-8'))
html = html.replace('/*__APPRECIATION_IMAGE__*/', 'data:image/png;base64,' + base64.b64encode((ROOT/'assets/wechat-appreciation.png').read_bytes()).decode('ascii'))
for marker, filename in [('THREE','three.min.js'),('ORBIT','OrbitControls.js'),('LUCIDE','lucide-lite.js'),('FXAA','FXAAShader.js'),('RENDER_QUALITY','render-quality.js'),('ENVIRONMENT','environment.js'),('INTERIOR','interior.js'),('DECOR_PRESET_A','decor-preset-a.js'),('SETTINGS_STORAGE','settings-storage.js'),('APPRECIATION','appreciation.js')]:
    html = html.replace('/*__'+marker+'__*/', (SOURCE/filename).read_text(encoding='utf-8').replace('</script', '<' + chr(92) + '/script'))
html = html.replace('/*__SITE__*/', (SOURCE/'solar-presets.json').read_text(encoding='utf-8'))
html = html.replace('/*__PLAN_LAYOUT__*/', (SOURCE/'plan-layout.json').read_text(encoding='utf-8'))
html = html.replace('/*__WALL_JUNCTIONS__*/', json.dumps(junction_fills(json.loads((SOURCE/'plan-layout.json').read_text(encoding='utf-8'))),separators=(',',':')))
html = html.replace('/*__CLOUD_CONFIG__*/', (SOURCE/'cloud-config.json').read_text(encoding='utf-8'))
html = html.replace('/*__BAKED_LIGHTING__*/', (SOURCE/'baked-lighting.json').read_text(encoding='utf-8'))
if '/*__' in html:
    raise RuntimeError('Unresolved template marker')
(OUTPUT/'index.html').write_text(html, encoding='utf-8')
(OUTPUT/'.nojekyll').touch()
(OUTPUT/'plans').mkdir(exist_ok=True)
for extension in ['svg','pdf','png']:
    shutil.copy2(ROOT/('plans/restored-floor-plan.'+extension), OUTPUT/'plans'/('restored-floor-plan.'+extension))
print(f'Built {OUTPUT / "index.html"} ({len(html.encode("utf-8")):,} bytes)')
