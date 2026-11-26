"""Present actual pointer-release WebGL frames without brightness edits."""
from pathlib import Path
import json,shutil,hashlib
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/quality-report/mouse-release';OUT.mkdir(parents=True,exist_ok=True)
records={s:json.loads((ROOT/f'validation/mouse-release-{s}.json').read_text()) for s in ['before','after']}
assert records['before']['result']=='regression-reproduced' and records['after']['result']=='passed'
cases={s:{r['id']:r for c in record['cases'] for r in c['states']} for s,record in records.items()}
font=lambda n,b=False:ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if b else 'C:/Windows/Fonts/msyh.ttc',n)
ids=['chrome-a-noon-off','chrome-a-noon-on','chrome-a-night-off','chrome-a-night-on']
labels={'chrome-a-noon-off':'正午关灯','chrome-a-noon-on':'正午开灯','chrome-a-night-off':'夜晚关灯','chrome-a-night-on':'夜晚开灯'}
for id in ids:
    held={s:[r for r in cases[s][id]['frames'] if r['phase']=='held'][-1] for s in records}
    assert held['before']['camera']==held['after']['camera'] and held['before']['rotation']==held['after']['rotation'] and held['before']['exposure']==held['after']['exposure']
    for stage in records:
        for name in ['held','release-first','release-peak','settled']:
            shutil.copyfile(ROOT/f'work/mouse-release/{stage}/{id}/{name}.webp',OUT/f'{stage}-{id}-{name}.webp')

canvas=Image.new('RGB',(1320,1050),'#f4f0e8');d=ImageDraw.Draw(canvas)
d.text((18,13),'电脑鼠标松开瞬间 · 实际画布逐帧对比',font=font(29,True),fill='#223e31')
d.text((18,58),'同机位、同曝光；截图220×156，仅放大排版；上方修复前，下方修复后',font=font(21),fill='#596c5d')
id='chrome-a-night-on'
for row,stage in enumerate(['before','after']):
    record=cases[stage][id];held=[r for r in record['frames'] if r['phase']=='held'][-1];released=[r for r in record['frames'] if r['phase']=='released']
    for col,(name,title,r) in enumerate([('held','松手前',held),('release-first','松手后第一帧',released[0]),('settled','恢复稳定',released[-1])]):
        x=440*col;y=106+row*466
        d.text((x+12,y),('修复前' if row==0 else '修复后')+' · '+title,font=font(23,True),fill='#244c39')
        canvas.paste(Image.open(OUT/f'{stage}-{id}-{name}.webp').resize((440,312),Image.Resampling.LANCZOS),(x,y+43))
        d.text((x+12,y+367),f'画布亮度 {r["mean"]:.2f}',font=font(22),fill='#334e3d')
        d.text((x+12,y+403),'静态光照 '+('保持' if r['static'] else '临时回退'),font=font(21),fill='#596c5d')
canvas.save(OUT/'release-comparison.jpg',quality=95,subsampling=0)

rows=[]
for id in ids:
    b=cases['before'][id];a=cases['after'][id]
    rows.append(f'<tr><td>{labels[id]}</td><td>{b["maxBrightnessDelta"]:.3f}</td><td>{a["maxBrightnessDelta"]:.5f}</td><td>保持</td></tr>')
count=sum(len(c['states']) for c in records['after']['cases']);frames=sum(len(r['frames']) for c in records['after']['cases'] for r in c['states'])
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>电脑鼠标松开瞬间闪光修复</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f2eb;color:#294233;font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1100px;margin:auto;padding:28px 18px}h1{font-size:clamp(25px,4vw,38px);line-height:1.3}a{color:#246a49}nav,.controls{display:flex;flex-wrap:wrap;gap:9px;margin:15px 0}button{font:inherit;color:inherit;padding:8px 13px;border:1px solid #c8d3c3;border-radius:7px;background:#fff;cursor:pointer}button[aria-pressed=true]{background:#2c6548;color:white}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:12px 0;border:1px solid #d5ddce;background:white;border-radius:10px;overflow:hidden}img{width:100%;display:block}figcaption{padding:9px 12px}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{padding:9px 6px;text-align:left;border-bottom:1px solid #ccd5c4}.notice{padding:14px;background:#e6ebdd;border-radius:9px}footer{color:#60735f;margin-top:30px}@media(max-width:600px){.pair{grid-template-columns:1fr}td,th{font-size:13px;padding:8px 4px}}</style><main><nav><a href="./">效果报告目录</a><a href="../?decor=a">打开main家装A</a><a href="mouse-release/frames.json">逐帧记录</a></nav><h1>电脑鼠标松开瞬间闪光修复</h1><p>拖动结束后，浏览器会发出普通click。页面body携带当前data-time，旧事件判断沿祖先查找时误认为点击了时段按钮，导致静态照明暂时回退、房间反射重载。现在只识别真正的时段按钮，拖动、松手和普通画布点击保持当前光照。</p><p class="notice">未调整四时段曝光、灯光能量、太阳方向或烘焙。清晨/正午/黄昏/夜晚曝光仍为1.00/0.92/1.04/0.86。保存与账号同步仍暂停。</p><figure><a href="mouse-release/release-comparison.jpg"><img src="mouse-release/release-comparison.jpg" alt="夜晚开灯松手前后逐帧对比"></a><figcaption>夜晚开灯 · 上修复前，下修复后。真实WebGL画布小图，仅放大与排版，没有后期调亮。</figcaption></figure><h2>松手后第一帧</h2><div class="controls" id="states">BUTTONS</div><div class="pair"><figure><img id="before" alt="修复前松手第一帧"><figcaption id="beforeCaption"></figcaption></figure><figure><img id="after" alt="修复后松手第一帧"><figcaption id="afterCaption"></figcaption></figure></div><table><thead><tr><th>状态</th><th>修复前最大跳变</th><th>修复后最大跳变</th><th>修复后静态光照</th></tr></thead><tbody>ROWS</tbody></table><p>数值为220×156画布平均亮度的绝对变化（0–255），与同一次操作最后5帧按住不动的均值比较，非照度测量。以实际鼠标按下、拖动、停住、松开产生的pointerup/click为输入，逐帧检查照明启用、合成次数、反射缓存版本/更新次数、曝光和相机位姿。</p><h2>验证范围</h2><p>Chrome桌面精细/轻量、缺HDR/depth扩展回退、Windows WebKit桌面，以及触屏/微信UA的真实浏览器点击模拟，共COUNT组四时段×开关灯×毛坯/A操作，记录FRAMES帧；所有组均保持静态光照和缓存版本，曝光固定。时段按钮、灯开关和房门更新仍正常，219张贴图、屋顶和保存暂停保持。模拟不代表真机微信验收。</p><footer>2026-11-26 · main开发测试，正式release保持独立。</footer></main><script>const labels=LABELS;let state='chrome-a-night-on';function update(){for(const s of ['before','after'])document.getElementById(s).src='mouse-release/'+s+'-'+state+'-release-first.webp';document.getElementById('beforeCaption').textContent=labels[state]+' · 修复前';document.getElementById('afterCaption').textContent=labels[state]+' · 修复后';for(const b of document.querySelectorAll('#states button'))b.setAttribute('aria-pressed',String(b.dataset.state===state))}document.getElementById('states').onclick=e=>{const b=e.target.closest('button');if(b){state=b.dataset.state;update()}};update();</script></html>'''
html=html.replace('BUTTONS',''.join(f'<button data-state="{id}">{labels[id]}</button>' for id in ids)).replace('ROWS',''.join(rows)).replace('COUNT',str(count)).replace('FRAMES',str(frames)).replace('LABELS',json.dumps(labels,ensure_ascii=False))
(OUT.parent/'mouse-release.html').write_text(html,encoding='utf-8',newline='\n')
(OUT/'frames.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.name!='manifest.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',newline='\n')
print('Report:',count,'cases,',frames,'frames,',len(manifest),'resources')
