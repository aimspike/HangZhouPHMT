"""Arrange actual WebGL captures; preserve pixels except resizing and labels."""
from pathlib import Path
import json, shutil, hashlib
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/quality-report/daylight-strength'
OUT.mkdir(parents=True,exist_ok=True)
NAMES={'living':'客厅','dining':'餐厅','master':'主卧','second':'次卧','kitchen':'厨房','bath':'卫生间','balcony':'阳台'}
TIMES={'morning':'清晨','noon':'正午','dusk':'黄昏','night':'夜晚'}
EXPOSURES={'morning':1,'noon':.92,'dusk':1.04,'night':.86}
records={s:json.loads((ROOT/f'validation/daylight-strength-{s}.json').read_text()) for s in ['before','after','calibrated']}
assert all(r['result']=='passed' for r in records.values())
for c0,c1,c2 in zip(*(records[s]['cases'] for s in records)):
    for a in c0['captures']:
        key=lambda b:all(a[k]==b[k] for k in ['time','on','room'])
        b=next(b for b in c1['captures'] if key(b));c=next(c for c in c2['captures'] if key(c))
        assert a['camera']==b['camera']==c['camera'] and a['angles']==b['angles']==c['angles'] and a['fov']==b['fov']==c['fov']
        assert a['exposure']==b['exposure'] and c['exposure']==EXPOSURES[c['time']]
        assert a['sunControl']==b['sunControl']==c['sunControl']=='1.7'
        assert a['skyControl']==b['skyControl']==c['skyControl']=='1.4'

# Exposure-only baselines already use the strengthened natural-light sources.
candidates=json.loads((ROOT/'validation/exposure-preset-candidates.json').read_text())
for t in TIMES:
    old=max(r['exposure'] for r in candidates['cases'] if r['time']==t)
    for on in [False,True]:
        for room in ['living','dining','bath']:
            r=next(r for r in candidates['cases'] if r['time']==t and r['on']==on and r['room']==room and r['exposure']==old)
            shutil.copyfile(ROOT/'work/daylight-strength/exposure-candidates'/r['file'],OUT/f'exposure-before-{t}-{"on" if on else "off"}-{room}.webp')

font=lambda n,b=False:ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if b else 'C:/Windows/Fonts/msyh.ttc',n)
def sheet(filename,title,rows):
    canvas=Image.new('RGB',(1600,90+len(rows)*606),'#f4f0e8');d=ImageDraw.Draw(canvas)
    d.text((16,12),title,font=font(29,True),fill='#203c31')
    d.text((16,55),'实际网页画布 · 仅缩放与排版；左调整前，右最终效果',font=font(21),fill='#53665a')
    for row,(label,before,after) in enumerate(rows):
        y=90+row*606
        for col,file in enumerate([before,after]):
            d.text((col*800+12,y+7),label+(' · 调整前' if col==0 else ' · 调整后'),font=font(22,True),fill='#244c37')
            canvas.paste(Image.open(OUT/file).convert('RGB').resize((800,563),Image.Resampling.LANCZOS),(800*col,y+43))
    canvas.save(OUT/filename,quality=95,subsampling=0)
sheet('noon-comparison.jpg','正午关灯 · 日光与天光增强后，按时段校准曝光',[(NAMES[r],f'before-pc-noon-off-{r}.webp',f'calibrated-pc-noon-off-{r}.webp') for r in ['living','dining']])
sheet('exposure-comparison.jpg','四个时段 · 相同光照，固定曝光校准',[(TIMES[t],f'exposure-before-{t}-on-living.webp',f'calibrated-pc-{t}-on-living.webp') for t in TIMES])

flash={s:json.loads((ROOT/f'work/daylight-strength/flash-{s}/frames.json').read_text())[:32] for s in ['before','after']}
flash_meta={s:[{'frame':i,'mean':r['mean'],'static':r['static']['enabled'],'ready':r['quality']['probeReady'],'exposure':r['exposure']} for i,r in enumerate(rows)] for s,rows in flash.items()}
for s in flash:
    peak=max((i for i,r in enumerate(flash[s]) if r['static']['enabled']),key=lambda i:flash[s][i]['mean'])
    for i in sorted(set([0,max(0,peak-1),peak,peak+1,24,31])):
        shutil.copyfile(ROOT/f'work/daylight-strength/flash-{s}/{i:03}.webp',OUT/f'flash-{s}-{i:03}.webp')
(OUT/'flash-frames.json').write_text(json.dumps(flash_meta,indent=2)+'\n')
(OUT/'captures.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>白天天光、固定曝光与关灯瞬态修复</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f2eb;color:#253d31;font:16px/1.65 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1440px;margin:auto;padding:28px 20px}h1{font-size:clamp(25px,4vw,40px);line-height:1.3}h2{margin-top:40px}p{max-width:1000px}a{color:#1f6446}nav,.controls{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}button{font:inherit;border:1px solid #c1cfc0;border-radius:8px;background:#fff;padding:7px 13px;color:inherit;cursor:pointer}button[aria-pressed=true]{background:#28583d;color:white}button:disabled{opacity:.35;cursor:default}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0;background:white;border:1px solid #dce1d4;border-radius:10px;overflow:hidden}figure img{display:block;width:100%;height:auto}figcaption{padding:8px 12px}.sheet{margin:20px 0}.sheet img{max-height:1000px;object-fit:contain}table{border-collapse:collapse;width:100%;max-width:900px}td,th{border-bottom:1px solid #d1d7c9;padding:9px;text-align:left}.note{background:#e7eade;padding:14px 18px;border-radius:10px}.flash{display:grid;grid-template-columns:1fr 1fr;gap:12px}.flash img{width:100%;image-rendering:auto}.chart{width:100%;max-width:900px;background:#fff;border:1px solid #d1d7c9}footer{margin-top:35px;color:#586c5c}@media(max-width:650px){main{padding:20px 12px}.pair{grid-template-columns:1fr}button{padding:6px 10px}td,th{padding:6px;font-size:14px}}
</style><main><nav><a href="./">效果报告目录</a><a href="../?decor=a">打开 main 看房</a><a href="daylight-strength/captures.json">截图与参数记录</a></nav><h1>白天天光、固定曝光与关灯瞬态修复</h1>
<p>正午日光增强35%、天光增强65%，清晨和黄昏适度提高。日光与天光仍可单独调节；太阳方向、参考时刻和光斑位置保留。曝光按四个时段固定，开关灯、转动视角和跨房间都保持该时段的同一个值。</p>
<table><thead><tr><th>时段</th><th>日光倍率</th><th>天光倍率</th><th>最终室内曝光</th></tr></thead><tbody><tr><td>清晨</td><td>1.18</td><td>1.30</td><td>1.00</td></tr><tr><td>正午</td><td>1.35</td><td>1.65</td><td>0.92</td></tr><tr><td>黄昏</td><td>1.10</td><td>1.20</td><td>1.04</td></tr><tr><td>夜晚</td><td>1.00</td><td>1.00</td><td>0.86</td></tr></tbody></table>
<p class="note">画面来自 Chrome 的真实 WebGL1 画布；每张等待静态照明和当前房间反射完成。PC 1280×900，手机390×844为触屏/微信UA模拟。图片未在后期调亮、修补阴影或生成替代画面。默认灯光能量50%，日光/天光控件170%/140%；对比机位、视野与控制值相同。</p>
<h2>本轮前后对比</h2><div id="device" class="controls"><button data-value="pc">桌面</button><button data-value="mobile">手机模拟</button></div><div id="time" class="controls"></div><div id="lights" class="controls"><button data-value="off">关灯</button><button data-value="on">开灯</button></div><div id="room" class="controls"></div><div id="baseline" class="controls"><button data-value="before">本轮修改前</button><button data-value="after">增强自然光、曝光校准前</button></div><div class="pair"><figure><a id="beforeLink"><img id="before" alt="本轮调整前实际网页画布"></a><figcaption id="beforeCaption"></figcaption></figure><figure><a id="afterLink"><img id="after" alt="自然光和固定曝光调整后实际网页画布"></a><figcaption id="afterCaption"></figcaption></figure></div><p id="caption"></p>
<p>这部分40组比较覆盖正午各房间的开关灯，以及其他时段客餐厅关灯。选择第二种基线可以单独观察曝光校准的作用；它和最终图使用相同的增强光源。</p><figure class="sheet"><a href="daylight-strength/noon-comparison.jpg"><img src="daylight-strength/noon-comparison.jpg" loading="lazy" alt="正午客餐厅关灯前后总览"></a></figure>
<h2>四时段固定曝光 · 开关灯都检查</h2><p>下方只比较曝光：自然光与灯具能量相同。左图使用原室内曝光，右图使用最终固定值；桌面相同画幅、相同机位，分别为960×675与1280×900画布。</p><div id="exposureTime" class="controls"></div><div id="exposureLights" class="controls"><button data-value="on">开灯</button><button data-value="off">关灯</button></div><div id="exposureRoom" class="controls"></div><div class="pair"><figure><a id="exposureBeforeLink"><img id="exposureBefore" alt="原曝光实际网页画布"></a><figcaption id="exposureBeforeCaption"></figcaption></figure><figure><a id="exposureAfterLink"><img id="exposureAfter" alt="固定曝光最终网页画布"></a><figcaption id="exposureAfterCaption"></figcaption></figure></div>
<p>清晨保持柔和自然光；正午压低叠加开灯时的白墙和台面高光；黄昏保留暖色和明暗差；夜晚降低大面积灯光的刺眼感。夜晚关灯仍保持夜景暗度，不用提高曝光把它模拟成白天。</p><figure class="sheet"><a href="daylight-strength/exposure-comparison.jpg"><img src="daylight-strength/exposure-comparison.jpg" loading="lazy" alt="清晨正午黄昏夜晚固定曝光对比"></a></figure>
<h2>关灯后的单帧高亮</h2><p>复现到的原因是照明切换后，旧灯光状态的房间反射缓存被短暂重新启用。现在场景状态改变时立即停用旧反射，只启用与当前状态版本一致的缓存。下图为修复前后关灯最初32帧的画布平均亮度；曝光均为当时的0.9504，以隔离修复作用。</p><svg class="chart" viewBox="0 0 900 240" role="img" aria-label="修复前后关灯32帧亮度曲线">CHART</svg><div class="flash"><figure><img src="daylight-strength/flash-before-013.webp" loading="lazy" alt="修复前第13帧短暂高亮"><figcaption>修复前 · 第13帧，旧反射短暂启用</figcaption></figure><figure><img src="daylight-strength/flash-after-024.webp" loading="lazy" alt="修复后稳定关灯画面"><figcaption>修复后 · 第24帧，旧反射保持停用</figcaption></figure></div><p>小图为240×168逐帧记录，未做亮度处理。该历史对比采于本轮曝光校准前；最终曝光已重新通过逐帧回归。桌面、手机模拟、缺HDR/depth扩展和Windows WebKit各检查夜晚/正午144帧，共1152帧；检查了转向、跨房间、返回、灯能量、曝光固定与反射缓存版本。</p>
<h2>漫游镜头高度</h2><p>室内模式 → 设置 → 室内视角与灯光 → 镜头高度。范围1.0–1.8米，步进5厘米，默认1.5米；即时升降，换房间和切换模式后返回室内仍沿用本次高度。已有设置只读恢复，新增调整仍不保存。</p>
<footer>2026-11-26 · main开发测试 · 正式release保持独立。手机、微信UA与Windows WebKit为模拟，未进行真机微信验收。画面亮度统计用于相同机位比较，不代表照度测量；视觉舒适度仍以实际观看为准。</footer></main><script>
const names=NAMES,times=TIMES,exposures=EXPOSURES,$=id=>document.getElementById(id),state={device:'pc',time:'noon',lights:'off',room:'living',baseline:'before',exposureTime:'noon',exposureLights:'on',exposureRoom:'living'};
for(const id of ['time','exposureTime'])for(const [value,name]of Object.entries(times)){const b=document.createElement('button');b.dataset.value=value;b.textContent=name;$(id).append(b)}for(const id of ['room','exposureRoom'])for(const [value,name]of Object.entries(names)){if(id==='exposureRoom'&&!['living','dining','bath'].includes(value))continue;const b=document.createElement('button');b.dataset.value=value;b.textContent=name;$(id).append(b)}
function imagePair(id,file){$(id).src='daylight-strength/'+file;$(id+'Link').href='daylight-strength/'+file}
function update(){if(state.time!=='noon'){state.lights='off';if(!['living','dining'].includes(state.room))state.room='living'}for(const key of Object.keys(state))for(const b of $(key).children){b.setAttribute('aria-pressed',String(b.dataset.value===state[key]));b.disabled=key==='lights'&&state.time!=='noon'&&b.dataset.value==='on'||key==='room'&&state.time!=='noon'&&!['living','dining'].includes(b.dataset.value)}const suffix=[state.device,state.time,state.lights,state.room].join('-')+'.webp';imagePair('before',state.baseline+'-'+suffix);imagePair('after','calibrated-'+suffix);$('beforeCaption').textContent=state.baseline==='before'?'本轮修改前':'自然光增强、原曝光';$('afterCaption').textContent='最终效果 · 固定曝光 '+exposures[state.time].toFixed(2);$('caption').textContent=times[state.time]+' · '+names[state.room]+' · '+(state.lights==='on'?'开灯':'关灯')+' · '+(state.device==='pc'?'桌面':'手机模拟');const e=[state.exposureTime,state.exposureLights,state.exposureRoom].join('-')+'.webp';imagePair('exposureBefore','exposure-before-'+e);imagePair('exposureAfter','calibrated-pc-'+e);$('exposureBeforeCaption').textContent=times[state.exposureTime]+' · 原曝光';$('exposureAfterCaption').textContent=times[state.exposureTime]+' · 固定曝光 '+exposures[state.exposureTime].toFixed(2)}
for(const key of Object.keys(state))$(key).addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled){state[key]=b.dataset.value;update()}});update();
</script></html>'''
chart='<path d="M45 20V205H875" stroke="#a6b5a2" fill="none"/>'
for s,color,label in [('before','#b14f36','修复前'),('after','#2c6a49','修复后')]:
    points=' '.join(f'{45+i*26:.1f},{205-r["mean"]*16:.1f}' for i,r in enumerate(flash[s]))
    chart+=f'<polyline points="{points}" stroke="{color}" fill="none" stroke-width="2.5"/><text x="{530 if s=="before" else 680}" y="28" fill="{color}" font-size="18">{label}</text>'
for i in [0,8,16,24,31]:chart+=f'<text x="{45+i*26}" y="229" font-size="14">{i}帧</text>'
for y in [0,5,10]:chart+=f'<text x="8" y="{210-y*16}" font-size="14">{y}</text>'
html=html.replace('NAMES',json.dumps(NAMES,ensure_ascii=False)).replace('TIMES',json.dumps(TIMES,ensure_ascii=False)).replace('EXPOSURES',json.dumps(EXPOSURES)).replace('CHART',chart)
(OUT.parent/'daylight-strength.html').write_text(html,encoding='utf-8')
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.is_file() and p.name!='manifest.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated daylight / exposure report:',len(manifest),'resources')
