"""Compose unretouched WebGL pillow evidence, geometry and bake provenance."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/quality-report/pillow-fix'
records={s:json.loads((ROOT/f'validation/pillow-fix-{s}.json').read_text()) for s in ['before','after']}
metrics={s:json.loads((ROOT/f'validation/pillow-surface-{s}.json').read_text()) for s in records}
geometry=json.loads((ROOT/'validation/pillow-geometry.json').read_text())
assert all(v['result']=='passed' for v in [*records.values(),*metrics.values(),geometry])
for b,a in zip(records['before']['cases'],records['after']['cases']):
    for x,y in zip(b['captures'],a['captures']):
        assert [x[k] for k in ['time','room','view','repeat','camera','angles','fov']]==[y[k] for k in ['time','room','view','repeat','camera','angles','fov']]
        assert x['calibration']['exposure']==y['calibration']['exposure'] and x['calibration']['effectiveLampPower']==y['calibration']['effectiveLampPower']
        assert x['static']['enabled'] and y['static']['enabled'] and x['quality']['probeReady'] and y['quality']['probeReady']
for a in metrics['after']['cases']:
    b=next(r for r in metrics['before']['cases'] if r['id']==a['id'] and r['room']==a['room'])
    assert a['deepDarkFraction']<.001 and a['p01']>b['p01']*.9
    if a.get('mobile'):assert a['deepDarkFraction']<b['deepDarkFraction']*.1

font=lambda n,b=False:ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if b else 'C:/Windows/Fonts/msyh.ttc',n)
def sheet(name,device,view):
    # Full frame resizing preserves the authored camera framing in both stages.
    w=550;h=387 if device=='pc' else 1190;row=44+h;canvas=Image.new('RGB',(1124,100+row*2+30),'#f3f0e8');d=ImageDraw.Draw(canvas)
    d.text((12,10),'枕头缝边稳定黑斑 · '+('桌面' if device=='pc' else '手机均衡模拟'),font=font(29,True),fill='#243e30')
    d.text((12,55),'左修复前 / 右修复后 · 正午关灯 · 同机位、同曝光0.92',font=font(20),fill='#596a5b')
    for ri,room in enumerate(['master','second']):
        y=100+ri*row
        for col,stage in enumerate(records):
            file=f'{stage}-{device}-noon-{room}-{view}-0.webp';x=12+col*550
            d.text((x+8,y+6),('主卧' if room=='master' else '次卧')+' · '+('修复前' if col==0 else '修复后'),font=font(22,True),fill='#244c37')
            canvas.paste(Image.open(OUT/file).convert('RGB').resize((w,h),Image.Resampling.LANCZOS),(x,y+44))
    canvas.save(OUT/name,quality=96,subsampling=0)
sheet('mobile-room-comparison.jpg','mobile','room');sheet('desktop-detail-comparison.jpg','pc','detail')
rows=''
for a in metrics['after']['cases']:
    b=next(r for r in metrics['before']['cases'] if r['id']==a['id'] and r['room']==a['room'])
    rows+=f'<tr><td>{a["id"]} / {"主卧" if a["room"]=="master" else "次卧"}</td><td>{b["deepDarkFraction"]*100:.3f}%</td><td>{a["deepDarkFraction"]*100:.3f}%</td><td>{a["p01"]:.1f}</td></tr>'
html='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>主次卧枕头缝边黑斑修复</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f2eb;color:#294233;font:16px/1.7 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1360px;margin:auto;padding:28px 18px}h1{font-size:clamp(25px,4vw,38px);line-height:1.3}a{color:#246a49}nav,.controls{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0}button{font:inherit;color:inherit;padding:7px 12px;border:1px solid #c8d3c3;border-radius:7px;background:#fff;cursor:pointer}button[aria-pressed=true]{background:#2c6548;color:white}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:12px 0;border:1px solid #d5ddce;background:white;border-radius:10px;overflow:hidden}img{width:100%;display:block}figcaption{padding:9px 12px}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{padding:9px 6px;text-align:left;border-bottom:1px solid #ccd5c4}.notice{padding:14px;background:#e6ebdd;border-radius:9px}.sheet img{max-height:1100px;object-fit:contain}footer{color:#60735f;margin-top:30px}@media(max-width:600px){.pair{grid-template-columns:1fr}td,th{font-size:13px;padding:7px 4px}}</style><main><nav><a href="./">效果报告目录</a><a href="../?decor=a">打开main家装A</a><a href="pillow-fix/evidence.json">截图与测量记录</a></nav><h1>主次卧枕头前沿、角部黑斑修复</h1><p>家装A、正午关灯，旧枕头缝边是部分埋入枕面的独立细管。被遮挡的缝边和接头样本进入顶点照明，形成稳定的成串黑点、锯齿暗线；手机减面让它更明显。关闭法线纹理不能消除，隐藏细管后部分阴影仍留在枕面；临时均匀照明能消除黑影，确认需要同时处理模型和烘焙。</p><p class="notice">两间卧室的枕头改为带连续细缝边的闭合布面，不再用相交细管。high/mobile保留同一枕头轮廓；全量重算124张固定照明、AO与反射。四时段曝光、灯光能量、太阳方向、原建筑快照和219张回退贴图保持。下方为真实网页画布，没有后期补光、修斑或AI替代画面。</p>
<div class="controls" id="device"><button data-value="pc">桌面1280×900</button><button data-value="mobile">手机均衡390×844</button><button data-value="webkit">Windows WebKit手机模拟</button></div><div class="controls" id="room"><button data-value="master">主卧</button><button data-value="second">次卧</button></div><div class="controls" id="time"><button data-value="noon">正午关灯</button><button data-value="night">夜晚开灯</button></div><div class="controls" id="view"><button data-value="room">房间原机位</button><button data-value="detail">枕头近景</button></div><div class="controls" id="repeat"><button data-value="0">照明与反射已完成</button><button data-value="1">再间隔2秒</button></div><div class="pair"><figure><a id="beforeLink"><img id="before" alt="枕头修复前实际网页"></a><figcaption>修复前</figcaption></figure><figure><a id="afterLink"><img id="after" alt="枕头修复后实际网页"></a><figcaption>修复后</figcaption></figure></div><p id="caption"></p><p>共48组前后比较、96张原始画布。每张等待固定照明与当前房间反射加载完成；所有对比固定机位、方向、FOV和曝光，重复帧间隔2秒。近景使用同一组测试相机参数，不修改产品默认相机。</p>
<figure class="sheet"><a href="pillow-fix/mobile-room-comparison.jpg"><img src="pillow-fix/mobile-room-comparison.jpg" loading="lazy" alt="手机主次卧正午关灯前后总览"></a><figcaption>手机均衡 · 主卧和次卧 · 正午关灯。仅缩放和排版。</figcaption></figure><figure class="sheet"><a href="pillow-fix/desktop-detail-comparison.jpg"><img src="pillow-fix/desktop-detail-comparison.jpg" loading="lazy" alt="桌面枕头近景前后总览"></a><figcaption>桌面近景 · 原始图片可点开查看。</figcaption></figure>
<h2>可见枕面像素复核</h2><p>用独立深度测试遮罩选出枕头可见像素，再向内缩2像素，排除轮廓抗锯齿。极暗比例是亮度低于该枕面中位数35%的像素占比，含真实接触阴影，不等同于精确缺陷计数。手机主卧约1.116%→0.019%，次卧约1.005%→0%；曝光始终0.92。桌面主卧剩余少量深色接触像素没有降到零，目视检查用于确认前沿连续性。</p><table><thead><tr><th>环境 / 房间</th><th>修复前极暗比例</th><th>修复后极暗比例</th><th>修复后1%分位亮度</th></tr></thead><tbody>ROWS</tbody></table>
<h2>模型、烘焙与兼容</h2><p>枕头为17层截面，每层64点，单枕1920三角形；表面不跨越非相邻截面，避免相交。high/mobile枕头位置差小于0.1毫米，独立缝边细管已移除。两张床每档总三角形减少：桌面18188→13228，手机9132→8752；其他18类模型数据逐项相同。850个实体共312414三角形的闭合、绕序、退化面和法线检查通过。</p><p>重烘焙high/mobile各149842/112847个家具样本，保留16位线性照明、独立天光/太阳/灯具、分房间反射和48MiB缓存；重新构建自包含单HTML。模型/烘焙检查与画面检查分开，浏览器模拟不代表真机微信验收。正式release保持独立，当前仅main开发测试。</p><footer>2026-11-26 · 对应VIS-05 · 保存与账号同步继续暂停。已知独立房门照明回退问题VIS-04另行处理。</footer></main><script>
const state={device:'mobile',room:'master',time:'noon',view:'room',repeat:'0'};function update(){for(const [key,value]of Object.entries(state))for(const b of document.querySelectorAll('#'+key+' button'))b.setAttribute('aria-pressed',String(b.dataset.value===value));for(const stage of ['before','after']){const url='pillow-fix/'+[stage,state.device,state.time,state.room,state.view,state.repeat].join('-')+'.webp';document.getElementById(stage).src=url;document.getElementById(stage+'Link').href=url}document.getElementById('caption').textContent=(state.room==='master'?'主卧':'次卧')+' · '+(state.time==='noon'?'正午关灯 / 曝光0.92':'夜晚开灯 / 曝光0.86')+' · '+(state.view==='room'?'原房间机位':'固定近景')+' · '+(state.repeat==='0'?'已完成加载':'间隔2秒重复帧')};for(const key of Object.keys(state))document.getElementById(key).onclick=e=>{const b=e.target.closest('button');if(b){state[key]=b.dataset.value;update()}};update();</script></html>'''.replace('ROWS',rows)
(OUT.parent/'pillow-fix.html').write_text(html,encoding='utf-8',newline='\n')
(OUT/'evidence.json').write_text(json.dumps({'captures':records,'pixelMeasurements':metrics,'geometry':geometry},ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.is_file() and p.name!='manifest.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',newline='\n')
print('Pillow report:',len(manifest),'resources, 48 exact-pose comparisons')
