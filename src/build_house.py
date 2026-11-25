"""Build the complete offline viewer and GitHub Pages assets, with no CDN."""
from pathlib import Path
import shutil
import json
import base64
import hashlib
from wall_junctions import junction_fills

SOURCE = Path(__file__).resolve().parent
ROOT = SOURCE.parent
OUTPUT = ROOT / 'docs'
OUTPUT.mkdir(exist_ok=True)
html = (SOURCE / 'house.template.html').read_text(encoding='utf-8')
html = html.replace('/*__FALLBACK_PLAN__*/', (ROOT/'plans/restored-floor-plan.svg').read_text(encoding='utf-8'))
html = html.replace('/*__APPRECIATION_IMAGE__*/', 'data:image/png;base64,' + base64.b64encode((ROOT/'assets/wechat-appreciation.png').read_bytes()).decode('ascii'))
for marker, filename in [('THREE','three.min.js'),('ORBIT','OrbitControls.js'),('LUCIDE','lucide-lite.js'),('FXAA','FXAAShader.js'),('REBUILD_ASSETS','asset-rebuild.js'),('RENDER_QUALITY','render-quality.js'),('STATIC_LIGHTING','static-lighting.js'),('ENVIRONMENT','environment.js'),('INTERIOR','interior.js'),('DECOR_PRESET_A','decor-preset-a.js'),('SETTINGS_STORAGE','settings-storage.js'),('APPRECIATION','appreciation.js')]:
    html = html.replace('/*__'+marker+'__*/', (SOURCE/filename).read_text(encoding='utf-8').replace('</script', '<' + chr(92) + '/script'))
html = html.replace('/*__SITE__*/', (SOURCE/'solar-presets.json').read_text(encoding='utf-8'))
html = html.replace('/*__PLAN_LAYOUT__*/', (SOURCE/'plan-layout.json').read_text(encoding='utf-8'))
html = html.replace('/*__WALL_JUNCTIONS__*/', json.dumps(junction_fills(json.loads((SOURCE/'plan-layout.json').read_text(encoding='utf-8'))),separators=(',',':')))
html = html.replace('/*__CLOUD_CONFIG__*/', (SOURCE/'cloud-config.json').read_text(encoding='utf-8'))
static_contents=(ROOT/'assets/static-bake/static-lighting.json').read_text(encoding='utf-8')
static_data=json.loads(static_contents)
static_script=ROOT/'scripts/bake_static_cycles.py'
if static_data['scriptSha256'] != hashlib.sha256(static_script.read_text(encoding='utf-8').encode()).hexdigest():
    raise RuntimeError('Static lighting is stale; regenerate using bake_static_cycles.py')
for filename,expected_hash in static_data['inputHashes'].items():
    if hashlib.sha256((ROOT/filename).read_text(encoding='utf-8').encode()).hexdigest()!=expected_hash:
        raise RuntimeError(f'Static lighting scene is stale: {filename}; export and rebake')
html = html.replace('/*__STATIC_LIGHTING_DATA__*/', static_contents)
html = html.replace('/*__BAKED_LIGHTING__*/', (SOURCE/'baked-lighting.json').read_text(encoding='utf-8'))
for marker, filename in [('REBUILD_MODELS','models.json'),('REBUILD_MATERIALS','material-assets.json')]:
    contents=(ROOT/'assets/rebuild'/filename).read_text(encoding='utf-8')
    script=ROOT/'scripts'/('rebuild_scene_assets.py' if marker=='REBUILD_MODELS' else 'prepare_rebuild_materials.py')
    if json.loads(contents)['authoringScriptSha256'] != hashlib.sha256(script.read_text(encoding='utf-8').encode()).hexdigest():
        raise RuntimeError(f'Rebuild asset is stale; regenerate using {script.name}')
    html = html.replace('/*__'+marker+'__*/', contents)
html = html.replace('/*__MOBILE_CHECK__*/', (SOURCE/'mobile-check.js').read_text(encoding='utf-8').replace('</script', '<' + chr(92) + '/script'))
if '/*__' in html:
    raise RuntimeError('Unresolved template marker')
(OUTPUT/'index.html').write_text(html, encoding='utf-8')
(OUTPUT/'.nojekyll').touch()
(OUTPUT/'plans').mkdir(exist_ok=True)
for extension in ['svg','pdf','png']:
    shutil.copy2(ROOT/('plans/restored-floor-plan.'+extension), OUTPUT/'plans'/('restored-floor-plan.'+extension))
print(f'Built {OUTPUT / "index.html"} ({len(html.encode("utf-8")):,} bytes)')
