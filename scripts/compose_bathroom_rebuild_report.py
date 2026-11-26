"""Compose actual matched WebGL canvas evidence without image lighting edits."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/quality-report/bathroom-rebuild'
records={s:json.loads((ROOT/f'validation/bathroom-rebuild-{s}.json').read_text(encoding='utf-8')) for s in ['before','after']}
names={'overview':'卫生间整体','vanity':'悬浮洗手台与背光镜','toilet':'马桶曲面、座圈与盖板','shower':'窄边透明玻璃淋浴房','kitchenSink':'厨房水槽与出水口对齐','sinkRim':'水槽盆沿与台面近景'}
pairs=[]
for record in records.values():assert record['result']=='passed'
for before,after in zip(records['before']['cases'],records['after']['cases']):
    for a,b in zip(before['captures'],after['captures']):
        assert all(a[k]==b[k] for k in ['id','time','camera','angles','fov'])
        assert a['calibration']==b['calibration']
        pairs.append({'device':'mobile' if before['mobile'] else 'pc','id':a['id'],'time':a['time'],'before':a['file'],'after':b['file']})
assert len(pairs)==24
(OUT/'captures.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',n)
def sheet(file,ids,title):
    h=108+530*len(ids)+36;im=Image.new('RGB',(1464,h),'#f2f0e9');draw=ImageDraw.Draw(im)
    draw.text((20,15),title,font=font(32),fill='#294a3a');draw.text((20,65),'左：调整前　｜　右：调整后　　同机位、正午开灯，实际网页画布',font=font(20),fill='#56645d')
    for row,id in enumerate(ids):
        p=next(p for p in pairs if p['device']=='pc' and p['time']=='noon' and p['id']==id);y=108+row*530
        draw.text((20,y),names[id],font=font(23),fill='#294a3a')
        for col,stage in enumerate(['before','after']):
            capture=ImageOps.contain(Image.open(OUT/p[stage]).convert('RGB'),(706,496),Image.Resampling.LANCZOS);im.paste(capture,(20+col*722,y+33))
    draw.text((20,h-30),'仅缩放、编码与排版；手机视口为模拟。',font=font(17),fill='#56645d');im.save(OUT/file,quality=95,subsampling=0)
sheet('bathroom-comparison.jpg',['shower','vanity','toilet'],'卫生间模型重做')
sheet('sink-comparison.jpg',['kitchenSink','sinkRim'],'厨房水槽对齐与曲面校正')
html='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>卫浴重做与厨房水槽校正</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f0e9;color:#293f34;font:16px/1.8 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:26px 20px 60px}a{color:#256b50}nav,.controls{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}button{font:inherit;padding:6px 14px;border:1px solid #9aafa0;background:white;border-radius:5px;color:#294a3a;cursor:pointer}button[aria-pressed=true]{background:#28634d;color:white}.notice{background:#e0e7dc;padding:18px;border-radius:6px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{display:block;width:100%;height:auto}figcaption{padding:7px 0}.mobile{max-width:800px;margin:auto}.sheet{max-width:980px;margin:30px auto}.small{font-size:13px;color:#5c6d62}button:focus-visible,a:focus-visible{outline:3px solid #bd8d3a;outline-offset:3px}@media(max-width:600px){main{padding:18px 12px 40px}.pair{gap:6px}button{font-size:14px;padding:6px 10px}}
</style></head><body><main><p>杭州 · 璞荟铭庭 / main</p><h1>卫浴重做与厨房水槽校正</h1><nav><a href="../?decor=a">打开家装 A</a><a href="furniture-placement.html">家具贴墙与朝向</a><a href="index.html">效果报告首页</a><a href="bathroom-rebuild/captures.json">实际相机与验证数据</a><a href="../deployment.json">部署提交</a></nav><div class="notice">按用户选择重做窄边透明玻璃淋浴房，补齐8毫米厚玻璃、窄框、铰链、把手、低挡水边、线性排水槽与整套花洒。洗手台沿用A参考图的悬浮木柜方向，改为一体内凹盆、墙出龙头和背光镜；马桶重做连续陶瓷曲面、座圈、支撑与掀起的盖板。原墙、门、窗与基本分区保留。</div><p>厨房水槽与开孔统一居中于柜体，水龙头出水口对准盆中心；盆沿嵌平安装，与北、东两段台面保持同高；台面凹槽与细密封边负责收口，没有用共面叠层遮掩落差。盆沿改用规则高密度环带与独立平面法线，改为柔和不锈钢反射，消除旧转角折痕。新布局已重生成固定光照、AO与房间反射，灯光基准与室内曝光沿用上轮校正。</p><div class="controls" id="device"><button data-value="pc">桌面视口</button><button data-value="mobile">手机视口</button></div><div class="controls" id="time"><button data-value="noon">正午开灯</button><button data-value="night">夜晚开灯</button></div><div class="controls" id="item">__BUTTONS__</div><p id="caption"></p><div class="pair" id="pair"><figure><a id="beforeLink"><img id="before" alt="同机位重做前画布"></a><figcaption>重做前</figcaption></figure><figure><a id="afterLink"><img id="after" alt="同机位重做后画布"></a><figcaption>重做后</figcaption></figure></div><p class="small">24组前后对比：桌面/手机 × 正午/夜晚 × 6个机位。每张均等待静态照明与房间反射加载完成，相机位置、方向、FOV及亮度控制相同。未对最终截图调亮、压暗或修补阴影。手机、微信UA与WebKit均为自动化模拟，尚未真机微信验证。</p><figure class="sheet"><a href="bathroom-rebuild/bathroom-comparison.jpg"><img src="bathroom-rebuild/bathroom-comparison.jpg" alt="卫生间三组模型前后对比" loading="lazy"></a></figure><figure class="sheet"><a href="bathroom-rebuild/sink-comparison.jpg"><img src="bathroom-rebuild/sink-comparison.jpg" alt="厨房水槽对齐与盆沿前后对比" loading="lazy"></a></figure><p>检查包含模型闭合、法线、支座贴墙、淋浴玻璃厚度及透明深度设置、水槽/出水口实际坐标、台面高度、门扫掠、通道和固定光照状态。原建筑快照与219张建筑回退贴图保持，仍为自包含WebGL1网页。整体视觉验收及实际手机性能继续跟踪。</p></main><script>const DATA=__DATA__,NAMES=__NAMES__;let device='pc',time='noon',item='shower';const $=id=>document.getElementById(id);function update(){const p=DATA.find(p=>p.device===device&&p.time===time&&p.id===item);for(const stage of ['before','after']){$(stage).src='bathroom-rebuild/'+p[stage];$(stage+'Link').href=$(stage).src}for(const [id,value]of [['device',device],['time',time],['item',item]])for(const b of $(id).children)b.setAttribute('aria-pressed',String(b.dataset.value===value));$('pair').classList.toggle('mobile',device==='mobile');$('caption').textContent=NAMES[item]+' · '+(device==='pc'?'桌面':'手机视口')+' · '+(time==='noon'?'正午':'夜晚')}for(const id of ['device','time','item'])for(const b of $(id).children)b.onclick=()=>{if(id==='device')device=b.dataset.value;else if(id==='time')time=b.dataset.value;else item=b.dataset.value;update()};update();</script></body></html>'''
html=html.replace('__BUTTONS__',''.join(f'<button data-value="{id}">{name}</button>' for id,name in names.items())).replace('__DATA__',json.dumps(pairs,ensure_ascii=False)).replace('__NAMES__',json.dumps(names,ensure_ascii=False))
(OUT.parent/'bathroom-rebuild.html').write_text(html,encoding='utf-8');print('Wrote 24 matched pairs and two contact sheets')
