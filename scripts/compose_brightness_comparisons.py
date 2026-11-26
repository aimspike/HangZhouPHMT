"""Lay out unaltered actual canvas captures with titles; no brightness edits."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];DIR=ROOT/'docs/quality-report/brightness'
font=Path('C:/Windows/Fonts/msyh.ttc');bold=Path('C:/Windows/Fonts/msyhbd.ttc')
def f(n,b=False):return ImageFont.truetype(str(bold if b else font),n)
NAMES={'living':'客厅','master':'主卧','kitchen':'厨房'}
VARIANTS={'baseline':('当前原效果','灯光 100% · 曝光 100%'),'lamp70':('只降低灯光','灯光 70% · 曝光 100%'),'lamp50':('只降低灯光','灯光 50% · 曝光 100%'),'exposure80':('只降低曝光','灯光 100% · 曝光 80%'),'exposure65':('只降低曝光','灯光 100% · 曝光 65%')}
manifest={'scope':'Exact actual WebGL screenshots resized uniformly and placed with labels, no image tone/brightness changes','images':[]}
def compose(name,scene,ids,rooms,title,subtitle):
    cellw=800;imageh=round(800*900/1280);head=118;rowhead=52;gap=12;width=cellw*3+gap*4;height=head+len(rooms)*(imageh+rowhead+gap)+52
    canvas=Image.new('RGB',(width,height),'#f2f0e9');draw=ImageDraw.Draw(canvas)
    draw.text((gap,16),title,font=f(32,True),fill='#263b31');draw.text((gap,65),subtitle,font=f(21),fill='#5b685f')
    sources=[]
    for row,room in enumerate(rooms):
        top=head+row*(imageh+rowhead+gap)
        for col,id in enumerate(ids):
            x=gap+col*(cellw+gap);label,setting=VARIANTS[id]
            draw.rectangle((x,top,x+cellw,top+rowhead),fill='#ffffff');draw.text((x+14,top+9),NAMES[room]+' · '+setting,font=f(24,True),fill='#2d4e3b')
            source=DIR/f'pc-{scene}-{room}-{id}.webp';im=Image.open(source).convert('RGB');im=im.resize((cellw,imageh),Image.Resampling.LANCZOS);canvas.paste(im,(x,top+rowhead));sources.append({'file':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'placement':[x,top+rowhead,cellw,imageh]})
    draw.text((gap,height-36),'实际网页 WebGL 画布 · 同一机位 / 家装 A / 相同材质与烘焙 · 仅统一缩放和排版，无后期调色',font=f(19),fill='#5b685f')
    dest=DIR/(name+'.jpg');canvas.save(dest,quality=96,subsampling=0);manifest['images'].append({'file':dest.name,'size':[width,height],'sources':sources})
compose('night-strong','night-on',['baseline','lamp50','exposure65'],['living','master','kitchen'],'夜晚开灯：灯光与曝光两种调整对比','左：当前效果　　中：灯光降低到 50%　　右：曝光降低到当前值的 65%')
compose('night-mild','night-on',['baseline','lamp70','exposure80'],['living','master','kitchen'],'夜晚开灯：较温和的两种调整','左：当前效果　　中：灯光降低到 70%　　右：曝光降低到当前值的 80%')
compose('noon-strong','noon-on',['baseline','lamp50','exposure65'],['living','master','kitchen'],'正午开灯：灯光与曝光两种调整对比','左：当前效果　　中：灯光降低到 50%　　右：曝光降低到当前值的 65%')
compose('noon-off-control','noon-off',['baseline','lamp50','exposure65'],['living'],'正午关灯：两种调整对自然光的影响','左：当前效果　　中：灯光滑块 50%（灯已关）　　右：曝光 65%')
(DIR/'contact-sheets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'images':[{'file':m['file'],'size':m['size']} for m in manifest['images']]},ensure_ascii=False))
