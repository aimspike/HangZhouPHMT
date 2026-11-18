"""Bake three actual solar directions into one RGB visibility atlas per mesh."""
from pathlib import Path
from io import BytesIO
import json,base64,time
import numpy as np
from PIL import Image,ImageFilter

ROOT=Path(__file__).parent
source=json.loads((ROOT/'bake-source.json').read_text())
data=json.loads((ROOT/'baked-lighting.json').read_text())
site=json.loads((ROOT/'solar-presets.json').read_text(encoding='utf-8'))
meshes={m['id']:m for m in source['meshes']}
blockers=[]
for m in meshes.values():
    if m['roof'] or m['glass'] or not m['box']:continue
    size=np.array(m['box']);p=np.array(m['position'])
    if np.sort(size)[1]<.12:continue
    blockers.append((p-size/2,p+size/2))
for a,b in [((1.52,2.8,.52),(6.38,3.18,2.9)),((4.12,2.8,-.18),(6.38,3.18,.52)),((-.18,2.8,2.72),(6.38,3.18,11.18)),((-.18,2.8,11),(3.38,3.18,11.98))]:blockers.append((a,b))
blockers=np.array(blockers,dtype=np.float32)

def visibility(p,d):
    result=np.ones(len(p),dtype=bool)
    inv=np.divide(1,d,out=np.full_like(d,1e12),where=np.abs(d)>1e-8)
    for lo,hi in blockers:
        if not result.any():break
        ids=np.flatnonzero(result);a=(lo-p[ids])*inv;b=(hi-p[ids])*inv
        near=np.maximum(np.minimum(a,b).max(axis=1),.003)
        far=np.minimum(np.maximum(a,b).min(axis=1),300)
        result[ids[far>near]]=False
    return result.astype(np.float32)

def shade(points,normal):
    p=points+normal*.006
    result=np.zeros((len(p),3),dtype=np.float32)
    for channel,preset in enumerate(site['presets'][:3]):
        sun=np.array(preset['direction'],dtype=np.float32)
        for offset in [(-.009,0),(0,-.009),(0,0),(0,.009),(.009,0)]:
            d=sun+np.array([offset[0],0,offset[1]],dtype=np.float32);d/=np.linalg.norm(d)
            cosine=max(float(normal@d),0)
            if cosine>.0001:result[:,channel]+=cosine*visibility(p,d)/5
    return result

start=time.monotonic()
for i,item in enumerate(data['maps']):
    if item['roof']:
        pixels=np.zeros((item['height'],item['width'],3),dtype=np.uint8)
    else:
        m=meshes[item['id']]
        vertices=np.array(m['positions'],dtype=np.float32).reshape(-1,3)+np.array(m['position'],dtype=np.float32)
        normals=np.array(m['normals'],dtype=np.float32).reshape(-1,3)
        pixels=np.zeros((item['height'],item['width'],3),dtype=np.uint8)
        for face,(x,y,w,h) in enumerate(item['rects']):
            a,b,c,d=vertices[face*4:face*4+4]
            u,v=np.meshgrid(np.linspace(0,1,w,dtype=np.float32),np.linspace(0,1,h,dtype=np.float32))
            points=c+(d-c)*u.ravel()[:,None]+(a-c)*v.ravel()[:,None]
            values=shade(points,normals[face*4]).reshape(h,w,3)
            im=Image.fromarray(np.uint8(np.clip(values*255,0,255))).filter(ImageFilter.GaussianBlur(.8))
            pixels[y-3:y+h+3,x-3:x+w+3]=np.pad(np.array(im),((3,3),(3,3),(0,0)),mode='edge')
    image=Image.fromarray(pixels[::-1])
    image=Image.new('RGB',(1,1)) if item['roof'] else image.resize((round(image.width*.75),round(image.height*.75)),Image.Resampling.LANCZOS)
    stream=BytesIO();image.save(stream,format='PNG',optimize=True)
    item['sunImage']='data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode()
    if i%10==0:print(f'solar maps {i+1}/{len(data["maps"])} ({time.monotonic()-start:.1f}s)',flush=True)
data['solarSite']=site
(ROOT/'baked-lighting.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'Completed solar maps in {time.monotonic()-start:.1f}s',flush=True)
