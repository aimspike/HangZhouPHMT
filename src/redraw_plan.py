from pathlib import Path
from html import escape
import math
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

group('walls')
# Paper folds distort the photograph; reconstruct all walls on orthogonal axes.
wall([(1700,2900),(1700,0),(6200,0),(6200,2900)],160)
wall([(0,2900),(1700,2900)],180,True)
wall([(0,2900),(0,12500)],180)
wall([(6200,4000),(6200,12500)],180)
wall([(0,12500),(6200,12500)],65)
wall([(1700,700),(4300,700)],180,True)
wall([(4300,0),(4300,2900)],120)
wall([(1700,2900),(3240,2900)],115)
wall([(4140,2900),(4300,2900)],115)
wall([(4300,2900),(6200,2900)],160)
wall([(5400,2900),(6200,2900)],160,True)
wall([(0,6400),(3050,6400)],85)
wall([(4350,6400),(6200,6400)],85)
wall([(1800,6400),(1800,7280)],85)
wall([(0,8200),(1950,8200)],85)
wall([(4400,6400),(4400,7380)],85)
wall([(4400,7580),(6200,7580)],85)
wall([(4400,7580),(4400,8200),(4270,8200)],85)
wall([(3070,8200),(3330,8200)],85)
wall([(3200,8200),(3200,12500)],170)
wall([(0,11800),(3200,11800)],185,True)
wall([(3200,11000),(6200,11000)],170)
for a,b in [([(1700,700),(1700,1050)],180), ([(1700,2500),(1700,2900)],180), ([(4300,0),(4300,700)],180), ([(6200,0),(6200,400)],220), ([(0,2900),(450,2900)],180), ([(0,2900),(0,3380)],180), ([(0,8000),(0,8380)],180), ([(6200,6400),(6200,6810)],180), ([(6200,8000),(6200,8380)],180), ([(3200,10400),(3200,10950)],170), ([(3200,11000),(3450,11000)],170), ([(5680,11000),(6200,11000)],190), ([(0,11450),(0,11800)],190), ([(6200,10900),(6200,11350)],180)]: wall(a,b,True)
end()

group('windows-and-platforms')
window(2170,700,3660,700,160)
window(1700,1120,1700,2450,140)
window(4770,0,5720,0,150)
window(450,2900,1250,2900,145)
window(0,3500,0,5850,150)
window(0,6590,0,7270,150)
window(700,11800,2400,11800,165)
window(3200,11870,3200,12450,145)
wall([(1700,0),(4300,0)],55)
wall([(1700,0),(1700,700)],55)
ml(3150,0,3150,700,26)
mp([(1810,630),(1810,160),(3060,160)],18)
mp([(5660,170),(6060,170),(6060,460),(5660,460),(5660,170)],18)
end()

group('doors')
ml(4140,2900,4140,2000,28)
arc(4140,2900,900,180,270)
ml(6200,2900,7240,2900,28)
arc(6200,2900,1040,0,90)
ml(6200,3940,6200,4000,22)
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
hdim([0,1700,4300,6200],[1700,2600,1900],166)
hdim([0,3200,6200],[3200,3000],1361)
vdim([0,700,2900,6400,8200,11800,12500],[700,2200,3500,1800,3600,700],172)
vdim([0,2900,6400,7600,11000,12500],[2900,3500,1200,3400,1500],957)
end()

group('reconstruction-notes')
line(120,1420,980,1420,.8,'#c2c6c9')
text(120,1452,'尺寸单位：毫米（mm）｜尺寸数字按原图转录。',14,'#626a70',anchor='start')
text(120,1480,'依据照片复原；墙厚、门窗及未标注细节为近似描绘，施工前需实测复核。',14,'#626a70',anchor='start')
end()
svg.append('</svg>')
(OUT/'restored-floor-plan.svg').write_text('\n'.join(svg),encoding='utf-8')
c.showPage(); c.save()
doc=pdfium.PdfDocument(str(OUT/'restored-floor-plan.pdf'))
page=doc[0]
page.render(scale=2.25).to_pil().save(OUT/'restored-floor-plan.png')
print('Created SVG, vector PDF, and PNG preview.')
