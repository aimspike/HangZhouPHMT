"""Arrange real canvas captures. Only crop, uniform resizing and labels."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont,ImageOps
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/quality-report/surface-fixes'
NAMES={'living':'客厅墙顶','dining':'餐厅墙顶','master':'主卧墙顶','bath':'卫生间墙顶','balconyBasin':'阳台一体台盆','bathBasin':'卫生间台盆','toilet':'马桶盖与盆体'}
def font(n,bold=False):return ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if bold else 'C:/Windows/Fonts/msyh.ttc',n)
manifest={'scope':'Actual WebGL screenshots, identical crops/resizing and labels, no tone or shadow retouching','sheets':[]}
def sheet(name,ids,title,crops=None,night=False):
    width=1624;cellw=800;head=100;labelh=44;imageh=430 if crops else 563;rowh=labelh+imageh+12
    canvas=Image.new('RGB',(width,head+rowh*len(ids)+40),'#f2f0e9');draw=ImageDraw.Draw(canvas)
    draw.text((12,12),title,font=font(30,True),fill='#263b31');draw.text((12,58),'左：修复前　　右：修复后　｜　同机位、同曝光、同灯光强度',font=font(21),fill='#5c695f');sources=[]
    for row,id in enumerate(ids):
        top=head+row*rowh
        for col,stage in enumerate(['before','after']):
            file=f'{stage}-pc-'+('night-' if night else '')+id+'.webp';p=OUT/file;im=Image.open(p).convert('RGB');crop=(crops or {}).get(id)
            if crop:im=im.crop(crop)
            im=ImageOps.fit(im,(cellw,imageh),method=Image.Resampling.LANCZOS);x=12+col*812
            draw.rectangle((x,top,x+cellw,top+labelh),fill='white');draw.text((x+12,top+7),NAMES[id]+(' · 修复前' if col==0 else ' · 修复后'),font=font(22,True),fill='#2d4e3b');canvas.paste(im,(x,top+labelh))
            sources.append({'file':file,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'crop':crop})
    draw.text((12,canvas.height-30),'真实网页画布 · 仅裁切、缩放、排版 · 手机为视口/微信 UA 模拟',font=font(17),fill='#5c695f')
    canvas.save(OUT/(name+'.jpg'),quality=96,subsampling=0);manifest['sheets'].append({'file':name+'.jpg','sources':sources})
crops={'balconyBasin':(410,460,1490,1040),'bathBasin':(545,440,1465,935),'toilet':(300,360,1750,1140)}
sheet('ceramic-noon',['balconyBasin','bathBasin','toilet'],'陶瓷曲面近检 · 正午关灯',crops)
sheet('ceramic-night',['balconyBasin','bathBasin','toilet'],'陶瓷曲面近检 · 夜晚开灯',crops,True)
sheet('walls-noon',['living','dining','master','bath'],'墙顶稳定画面 · 正午关灯')
(OUT/'contact-sheets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
captures={stage:json.loads((ROOT/f'validation/surface-{stage}.json').read_text(encoding='utf-8')) for stage in ['before','after']}
(OUT/'captures.json').write_text(json.dumps(captures,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
css=(ROOT/'docs/quality-report/brightness-comparison.html').read_text(encoding='utf-8').split('<style>')[1].split('</style>')[0]
buttons=''.join(f'<button data-room="{id}">{name}</button>' for id,name in NAMES.items())
html='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>墙顶斑驳与陶瓷折面修复对比</title><style>CSS</style></head><body><main><p>杭州 · 璞荟铭庭 / main 实际网页对比</p><h1>墙顶斑驳与陶瓷折面修复</h1><p>观察正午关灯后的墙顶，以及阳台台盆、卫生间台盆和马桶的曲面。所有画面均在固定光照和房间反射加载完成后采集；前后保持同一机位、曝光和灯光强度。</p><nav><a href="../?decor=a">打开 main 家装 A</a><a href="brightness-comparison.html">灯光 / 曝光幅度对比</a><a href="index.html">效果报告首页</a><a href="surface-fixes/captures.json">相机与加载状态</a><a href="../deployment.json">部署提交</a></nav><div class="notice">本轮修复针对稳定画面的烘焙噪声、暗部量化色带与陶瓷曲面。原默认灯光和曝光保持，夜晚开灯图仍使用原灯光强度；亮度取舍继续见独立对比页。</div><h2>滑动查看同机位前后差异</h2><div class="controls" id="device"><button data-device="pc">桌面视口</button><button data-device="mobile">手机视口</button></div><div class="controls" id="scene"><button data-scene="noon">正午关灯</button><button data-scene="night">夜晚开灯 · 陶瓷近景</button></div><div class="controls" id="room">BUTTONS</div><div class="compare" id="compare"><img id="after" alt="修复后的实际网页画布"><img id="before" class="before" alt="相同机位修复前的实际网页画布"><div class="labels"><span>修复前</span><span>修复后</span></div></div><label class="slider">对比位置<input id="split" type="range" min="0" max="100" value="50" aria-label="修复前后对比滑块"></label><p id="caption"></p><div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><figure><a id="beforeLink"><img id="beforeFull" alt="修复前全图"></a><figcaption>修复前 · 点击查看完整画布</figcaption></figure><figure><a id="afterLink"><img id="afterFull" alt="修复后全图"></a><figcaption>修复后 · 点击查看完整画布</figcaption></figure></div><h2>陶瓷近景</h2><p>并排图使用相同裁切，便于检查盆沿、转角、盆底和高光。完整画布与手机视口在上方切换。</p><figure class="sheet"><a href="surface-fixes/ceramic-noon.jpg"><img src="surface-fixes/ceramic-noon.jpg" loading="lazy" alt="三处陶瓷正午关灯前后近景"></a><figcaption>正午关灯 · 左修复前 / 右修复后</figcaption></figure><figure class="sheet"><a href="surface-fixes/ceramic-night.jpg"><img src="surface-fixes/ceramic-night.jpg" loading="lazy" alt="三处陶瓷夜晚开灯前后近景"></a><figcaption>夜晚开灯 · 原曝光与原灯光强度</figcaption></figure><h2>四处墙顶</h2><figure class="sheet"><a href="surface-fixes/walls-noon.jpg"><img src="surface-fixes/walls-noon.jpg" loading="lazy" alt="客厅餐厅主卧卫生间正午关灯墙顶前后对比"></a><figcaption>静态光照、反射均已加载的稳定画面</figcaption></figure><h2>修复内容与验证范围</h2><p>建筑漫反射改为2048采样，关闭过早终止低能天光的自适应采样，并在独立UV区域内对线性HDR数据降噪，保留分离的太阳照明。家具漫反射1024采样、AO256采样；建筑与家具照明以16位高低字节保存，网页解码后插值；建筑运行时图集也保留双字节组合，避免重新降回8位产生色带。</p><p>两处台盆采用规则密集曲面和独立陶瓷材质，平面盆沿保持竖直法线，手机档保留曲面采样；马桶曲面增加细分。陶瓷不使用织物或石材凹凸纹理，照明降噪按位置和法线限制在相近表面内。没有对最终截图做平滑、调亮或阴影修图。</p><p>共40张实际WebGL画布（20组前后对比）：桌面和手机视口各7组正午关灯、3组夜晚开灯。原建筑快照、墙线、门洞和219张旧烘焙保持，新的Cycles照明与反射已重新生成。手机/微信UA、Windows WebKit与缺HDR/depth扩展检查属于模拟，物理手机微信仍待实际验证。单HTML约HTML_SIZE MB，首次加载体积较上一版增加，真机持续性能仍待验收。</p><footer>2026-11-26 · main 开发测试页 · 正式 release 独立保留。灯光与曝光默认值保持原值。</footer></main><script>
const names=NAMES,state={device:'pc',scene:'noon',room:'balconyBasin'},$=id=>document.getElementById(id),ceramics=['balconyBasin','bathBasin','toilet'];
function url(stage){return 'surface-fixes/'+stage+'-'+state.device+'-'+(state.scene==='night'?'night-':'')+state.room+'.webp'}
function update(){if(state.scene==='night'&&!ceramics.includes(state.room))state.room='balconyBasin';for(const key of ['device','scene','room'])for(const b of $(key).children){b.setAttribute('aria-pressed',String(b.dataset[key]===state[key]));if(key==='room')b.hidden=state.scene==='night'&&!ceramics.includes(b.dataset.room);}for(const stage of ['before','after']){$(stage).src=url(stage);$(stage+'Full').src=url(stage);$(stage+'Link').href=url(stage);}$('compare').classList.toggle('mobile',state.device==='mobile');$('caption').textContent=names[state.room]+' · '+(state.scene==='noon'?'正午关灯':'夜晚开灯')+' · '+(state.device==='pc'?'1280×900桌面视口':'390×844手机模拟')+'；左修复前，右修复后。';}
for(const key of ['device','scene','room'])$(key).addEventListener('click',e=>{const b=e.target.closest('button');if(b){state[key]=b.dataset[key];update();}});$('split').addEventListener('input',e=>$('compare').style.setProperty('--split',e.target.value+'%'));update();
</script></body></html>'''.replace('CSS',css).replace('BUTTONS',buttons).replace('NAMES',json.dumps(NAMES,ensure_ascii=False)).replace('HTML_SIZE',f'{(ROOT/"docs/index.html").stat().st_size/1e6:.1f}')
(ROOT/'docs/quality-report/surface-fixes.html').write_text(html,encoding='utf-8')
print('Wrote 3 comparison sheets, 40 captures and interactive report')
