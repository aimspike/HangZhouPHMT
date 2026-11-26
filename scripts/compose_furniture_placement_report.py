"""Arrange settled WebGL canvas captures. Resize/encode only; no lighting retouch."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/quality-report/furniture-placement'
records={stage:json.loads((ROOT/f'validation/furniture-placement-{stage}.json').read_text(encoding='utf-8')) for stage in ['before','after']}
for record in records.values():assert record['result']=='passed'
names={'tv':'电视柜贴北墙','wardrobe':'次卧衣柜贴北、东两面墙','nightstand':'主卧床头柜旋转90°，正面朝东'}
pairs=[]
for before,after in zip(records['before']['cases'],records['after']['cases']):
    for a,b in zip(before['captures'],after['captures']):
        assert all(a[k]==b[k] for k in ['id','time','camera','angles','fov'])
        pairs.append({'device':'mobile' if before['mobile'] else 'pc','id':a['id'],'time':a['time'],'before':a['file'],'after':b['file']})
(OUT/'captures.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
canvas=Image.new('RGB',(1464,1733),'#f2f0e9');draw=ImageDraw.Draw(canvas)
draw.text((20,15),'家具贴墙与朝向调整',font=font(32),fill='#294a3a')
draw.text((20,65),'左：调整前　｜　右：调整后　　同机位、正午开灯，实际网页画布',font=font(20),fill='#56645d')
for row,id in enumerate(names):
    p=next(p for p in pairs if p['device']=='pc' and p['time']=='noon' and p['id']==id)
    y=108+row*530;draw.text((20,y),names[id],font=font(23),fill='#294a3a')
    for col,stage in enumerate(['before','after']):
        im=Image.open(OUT/p[stage]).convert('RGB');im=ImageOps.contain(im,(706,496),Image.Resampling.LANCZOS)
        canvas.paste(im,(20+col*722,y+33))
draw.text((20,1700),'仅缩放、编码与排版；手机视口为模拟，未进行真机微信验证。',font=font(17),fill='#56645d')
canvas.save(OUT/'comparison.jpg',quality=95,subsampling=0)
html='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>家具贴墙与朝向调整</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f0e9;color:#293f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:26px 20px 60px}a{color:#256b50}nav,.controls{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}button{font:inherit;padding:6px 14px;border:1px solid #9aafa0;background:white;border-radius:5px;color:#294a3a;cursor:pointer}button[aria-pressed=true]{background:#28634d;color:white}.notice{background:#e0e7dc;padding:18px;border-radius:6px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{padding:7px 0}.mobile{max-width:800px;margin:auto}.sheet{max-width:980px;margin:30px auto}.small{font-size:13px;color:#5c6d62}input{width:100%;accent-color:#28634d}button:focus-visible,a:focus-visible{outline:3px solid #bd8d3a;outline-offset:3px}@media(max-width:600px){main{padding:18px 12px 40px}.pair{gap:6px}button{font-size:14px;padding:6px 10px}}
</style></head><body><main><p>杭州 · 璞荟铭庭 / main</p><h1>家具贴墙与朝向调整</h1><nav><a href="../?decor=a">打开家装 A</a><a href="index.html">效果报告首页</a><a href="furniture-placement/captures.json">相机与验证数据</a><a href="../deployment.json">部署提交</a></nav><div class="notice">电视柜由原先约30厘米的后方留空改为贴北墙，并向右微调以避开墙角实心补片。默认平开门时贴墙；书房改为外挂推拉门时，电视、柜体和台面物品一起前移13厘米让出门扇，切回平开门后贴墙。次卧衣柜保持北、东墙角位置，贴墙的背板与右侧板改为平直接触面；主卧床头柜旋转90°，正面朝东，台灯与台面物品同步调整。</div><div class="controls" id="device"><button data-value="pc">桌面视口</button><button data-value="mobile">手机视口</button></div><div class="controls" id="time"><button data-value="noon">正午开灯</button><button data-value="night">夜晚开灯</button></div><div class="controls" id="item"><button data-value="tv">电视柜</button><button data-value="wardrobe">次卧衣柜</button><button data-value="nightstand">主卧床头柜</button></div><p id="caption"></p><div class="pair" id="pair"><figure><a id="beforeLink"><img id="before" alt="同机位调整前画布"></a><figcaption>调整前</figcaption></figure><figure><a id="afterLink"><img id="after" alt="同机位调整后画布"></a><figcaption>调整后</figcaption></figure></div><p class="small">12组前后对比：桌面/手机 × 正午/夜晚 × 三处家具。均等待静态照明与反射加载完成后再采集，相机位置、方向与FOV一致。未对最终画面后期调亮、压暗或修图。手机与微信UA为模拟。</p><figure class="sheet"><a href="furniture-placement/comparison.jpg"><img src="furniture-placement/comparison.jpg" alt="三处家具前后对比总览" loading="lazy"></a></figure><p>新家具布置已重新导出并重烘焙固定光照、AO与反射。原建筑墙线、门洞与219张建筑回退贴图保持。检查实际柜面到两墙距离、全部门型扫掠、床三侧通行与手机横竖屏；真机微信和整体视觉验收仍待完成。</p></main><script>const DATA=__DATA__;let device='pc',time='noon',item='tv';const $=id=>document.getElementById(id);function update(){const p=DATA.find(p=>p.device===device&&p.time===time&&p.id===item);for(const stage of ['before','after']){$(stage).src='furniture-placement/'+p[stage];$(stage+'Link').href=$(stage).src}for(const [id,value]of [['device',device],['time',time],['item',item]])for(const b of $(id).children)b.setAttribute('aria-pressed',String(b.dataset.value===value));$('pair').classList.toggle('mobile',device==='mobile');$('caption').textContent=(device==='pc'?'桌面':'手机视口')+' · '+(time==='noon'?'正午':'夜晚')+' · 同机位实际画布'}for(const id of ['device','time','item'])for(const b of $(id).children)b.onclick=()=>{if(id==='device')device=b.dataset.value;else if(id==='time')time=b.dataset.value;else item=b.dataset.value;update()};update();</script></body></html>'''
(OUT.parent/'furniture-placement.html').write_text(html.replace('__DATA__',json.dumps(pairs,ensure_ascii=False)),encoding='utf-8')
print('Wrote 12 comparison pairs and one contact sheet')
