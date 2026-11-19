from pathlib import Path
from html import escape
import math
import json
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'plans'
OUT.mkdir(exist_ok=True)
W, H = 1100, 1550
S, OX, OY = .086, 290, 225
import os
FONT_PATH = os.environ.get('HOUSE_FONT', r'C:\Windows\Fonts\msyh.ttc')
pdfmetrics.registerFont(TTFont('YaHei', FONT_PATH, subfontIndex=0))
c = canvas.Canvas(str(OUT / 'restored-floor-plan.pdf'), pagesize=(W*.54,H*.54))
c.setTitle('89-A floor plan - reconstructed from photograph')
c.scale(.54,.54)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1550" viewBox="0 0 1100 1550">',
       '<title>89-A 户型平面图（照片复原）</title>',
       '<desc>Editable vector reconstruction. Dimensions transcribed from the source photograph in millimetres. Unspecified geometry and wall thickness are approximate.</desc>',
       '<rect width="1100" height="1550" fill="white"/>']

def group(name):
    svg.append(f'<g id="{name}">')

def end():
    svg.append('</g>')

def line(x1,y1,x2,y2,width=1,color='#222222'):
    svg.append(f'<line x1="{x1:.3f}" y1="{y1:.3f}" x2="{x2:.3f}" y2="{y2:.3f}" stroke="{color}" stroke-width="{width:.3f}"/>')
    c.setStrokeColor(HexColor(color)); c.setLineWidth(width)
    c.line(x1,H-y1,x2,H-y2)

def poly(points,width=1,fill=None,color='#222222',closed=False):
    pts=' '.join(f'{x:.3f},{y:.3f}' for x,y in points)
    tag='polygon' if closed else 'polyline'
    svg.append(f'<{tag} points="{pts}" fill="{fill or "none"}" stroke="{color}" stroke-width="{width:.3f}" stroke-linejoin="miter"/>')
    p=c.beginPath(); p.moveTo(points[0][0],H-points[0][1])
    for x,y in points[1:]: p.lineTo(x,H-y)
    if closed: p.close()
    c.setStrokeColor(HexColor(color)); c.setLineWidth(width)
    if fill: c.setFillColor(HexColor(fill))
    c.drawPath(p,stroke=1,fill=int(bool(fill)))

def text(x,y,value,size=21,color='#222222',angle=0,anchor='middle'):
    svg.append(f'<text x="{x:.3f}" y="{y:.3f}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" text-anchor="{anchor}" fill="{color}"'+(f' transform="rotate({angle} {x:.3f} {y:.3f})"' if angle else '')+f'>{escape(value)}</text>')
    c.saveState(); c.translate(x,H-y); c.rotate(-angle)
    c.setFont('YaHei',size); c.setFillColor(HexColor(color))
    if anchor=='middle': c.drawCentredString(0,0,value)
    else: c.drawString(0,0,value)
    c.restoreState()

def xy(x,y): return OX+x*S,OY+y*S
def ml(x1,y1,x2,y2,width=20,color='#222222'):
    line(*xy(x1,y1),*xy(x2,y2),width*S,color)
def mp(points,width=20,fill=None,color='#222222',closed=False):
    poly([xy(x,y) for x,y in points],width*S,fill,color,closed)
def label(x,y,value,size=21): text(*xy(x,y),value,size)

def wall(points,thickness=160,solid=False):
    assert all(x1 == x2 or y1 == y2 for (x1,y1),(x2,y2) in zip(points,points[1:])), 'Wall must be orthogonal'
    mp(points,thickness,None,'#303438')
    if not solid: mp(points,max(10,thickness-36),None,'#ffffff')

def window(x1,y1,x2,y2,thickness=150):
    assert x1 == x2 or y1 == y2, 'Window must be orthogonal'
    dx,dy=x2-x1,y2-y1; length=math.hypot(dx,dy)
    nx,ny=-dy/length,dx/length
    mp([(x1,y1),(x2,y2)],thickness+25,None,'#ffffff')
    for offset in [-thickness/2,-thickness/6,thickness/6,thickness/2]:
        ml(x1+nx*offset,y1+ny*offset,x2+nx*offset,y2+ny*offset,13)
    ml(x1-nx*thickness/2,y1-ny*thickness/2,x1+nx*thickness/2,y1+ny*thickness/2,16)
    ml(x2-nx*thickness/2,y2-ny*thickness/2,x2+nx*thickness/2,y2+ny*thickness/2,16)

def arc(cx,cy,r,start,finish):
    # Same sampled curve feeds both vector exports.
    points=[(cx+r*math.cos(math.radians(a)),cy+r*math.sin(math.radians(a))) for a in [start+(finish-start)*i/50 for i in range(51)]]
    mp(points,17)

def hdim(xs,values,y):
    pxs=[xy(x,0)[0] for x in xs]
    line(pxs[0]-7,y,pxs[-1]+7,y,.85,'#53585c')
    for x in pxs:
        line(x,y-13,x,y+13,.8,'#53585c'); line(x-3,y+4,x+3,y-4,1.4,'#53585c')
    for a,b,value in zip(pxs,pxs[1:],values): text((a+b)/2,y-9,str(value),17,'#40464a')

def vdim(ys,values,x):
    pys=[xy(0,y)[1] for y in ys]
    line(x,pys[0]-7,x,pys[-1]+7,.85,'#53585c')
    for y in pys:
        line(x-13,y,x+13,y,.8,'#53585c');line(x-4,y+3,x+4,y-3,1.4,'#53585c')
    for a,b,value in zip(pys,pys[1:],values): text(x-10,(a+b)/2,str(value),17,'#40464a',-90)

group('heading')
text(W/2,73,'89-A 户型平面图',29)
text(W/2,108,'照片复原 · 矢量重绘',14,'#626a70')
end()

layout=json.loads((ROOT/'src/plan-layout.json').read_text(encoding='utf-8'))

def model_segment(w,a,b):
    along=w['a'][1]==w['b'][1]
    return [(1000*(w['a'][0]+v if along else w['a'][0]),1000*(w['a'][1] if along else w['a'][1]+v)) for v in [a,b]]

group('walls')
for w in layout['walls']:
    group('wall-'+w['id'])
    length=math.dist(w['a'],w['b']); previous=0
    for op in w.get('openings',[]):
        if op['a']>previous: wall(model_segment(w,previous,op['a']),w['t']*1000)
        previous=op['b']
    if previous<length: wall(model_segment(w,previous,length),w['t']*1000)
    end()
end()

group('bearing-from-source-black-regions')
for s in layout['bearing']:
    mp([(p[0]*1000,p[1]*1000) for p in [s['a'],s['b']]],s['t']*1000,None,'#b4513f')
end()

group('windows-and-platforms')
for w in layout['walls']:
    for op in w.get('openings',[]):
        if op['kind'] in ['window','sliding']:
            a,b=model_segment(w,op['a'],op['b']);window(*a,*b,w['t']*1000)
# Two low equipment areas and the kitchen service shaft shown in the photograph.
ml(3150,0,3150,700,26)
mp([(1810,630),(1810,160),(3060,160)],18)
mp([(5660,170),(6060,170),(6060,460),(5660,460),(5660,170)],18)
# The glazed partition in the south platform is not a full-height interior window.
window(3200,11870,3200,12450,65)
end()

group('doors-current-viewer-scheme')
for d in layout['doors']:
    group('door-'+d['id'])
    width=d['end']-d['start']
    def local(u,v):
        return ((d['start']+u)*1000,(d['fixed']+v)*1000) if d['axis']=='x' else ((d['fixed']-v)*1000,(d['start']+u)*1000)
    if d.get('allowSliding'):
        run=(width-.056)/2;panel=run+.02;outside=d['outside']
        # Closed panel outlines and the external single-side parking track.
        for i,u in enumerate([.028,.028+run-.02]):
            v=outside*(d['depth']/2+.0535+i*.035)
            mp([local(u,v-.011),local(u+panel,v-.011),local(u+panel,v+.011),local(u,v+.011)],12,None,'#536d68',True)
        park=-panel-.04 if d['stack']=='left' else width+.04
        mp([local(min(-.045,park-.035),outside*(d['depth']/2+.076)),local(max(width+.045,park+panel+.035),outside*(d['depth']/2+.076))],12,None,'#536d68')
        center=width/2;direction=-1 if d['stack']=='left' else 1;v=outside*(d['depth']/2+.26)
        mp([local(center-direction*.15,v),local(center+direction*.15,v),local(center+direction*.07,v-.055)],12,None,'#536d68')
    else:
        inset=.068 if 'sideWall' in d else 0
        pivot=.01+inset if d['hingeSide']=='left' else width-.01-inset
        span=width-.01-pivot if d['hingeSide']=='left' else pivot-.01
        sign=1 if d['hingeSide']=='left' else -1
        points=[local(pivot+sign*span*math.cos(d['angle']*i/50),-sign*span*math.sin(d['angle']*i/50)) for i in range(51)]
        mp(points,12,None,'#536d68');mp([local(pivot,0),points[-1]],25,None,'#536d68')
    end()
end()

group('room-labels')
label(3000,1730,'书房',22)
label(3000,2090,'（避难间）',18)
label(5260,1720,'厨房',22)
label(3680,435,'设备平台',15)
label(1530,4660,'客厅',24)
label(5070,5080,'餐厅',24)
label(900,7360,'卫生间',20)
label(5290,7140,'储藏间',20)
label(1510,10450,'主卧',24)
label(4780,10150,'次卧',24)
label(4700,11910,'阳台',22)
label(1430,12260,'设备平台',19)
box=[xy(2700,4540),xy(3850,4540),xy(3850,5120),xy(2700,5120)]
poly(box,1.2,None,closed=True)
label(3275,4955,'89-A',24)
end()

group('dimensions-mm')
for key,y in [('north',166),('south',1361)]:
    data=layout['dimensions'][key];hdim([p*1000 for p in data['points']],data['values'],y)
for key,x in [('west',172),('east',957)]:
    data=layout['dimensions'][key];vdim([p*1000 for p in data['points']],data['values'],x)
end()

group('reconstruction-notes')
line(120,1402,980,1402,.8,'#c2c6c9')
line(122,1426,149,1426,7,'#b4513f')
text(162,1431,'承重墙标记：按原图实黑区域转录，结构性质以正式结构图为准。',13,'#626a70',anchor='start')
text(120,1460,'尺寸单位：mm；标注数字按原图转录，门窗净宽及墙厚为近似值。',13,'#626a70',anchor='start')
text(120,1487,'门扇按当前网页方案补充：卧室窄边全包平开，其余房门外侧吊轨推拉。',13,'#626a70',anchor='start')
text(120,1514,'V11 复核重绘 · 图纸与网页共用墙线 / 门洞数据 · 仅供空间浏览。',12,'#626a70',anchor='start')
end()
svg.append('</svg>')
(OUT/'restored-floor-plan.svg').write_text('\n'.join(svg),encoding='utf-8')
c.showPage(); c.save()
doc=pdfium.PdfDocument(str(OUT/'restored-floor-plan.pdf'))
page=doc[0]
page.render(scale=2.25).to_pil().save(OUT/'restored-floor-plan.png')
print('Created SVG, vector PDF, and PNG preview.')
