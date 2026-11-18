"""Bake diffuse sky exposure and its room bounce into the unused lamp R channel.

G/B retain the original fixture lighting exactly. Sky is independent of the
three sun directions, scaled and tinted by each outdoor lighting preset.
"""
import base64, json, time
from io import BytesIO
import numpy as np
from PIL import Image, ImageFilter
from daylight_transport import ROOT, meshes, data, groups, owners, visible, AXES, sample_volume

start=time.monotonic()
directions=[];weights=[]
for i in range(64):
    up=(i+.5)/64;angle=i*np.pi*(3-np.sqrt(5));radius=np.sqrt(1-up*up)
    directions.append([radius*np.cos(angle),up,radius*np.sin(angle)])
    weights.append((.6+.4*up)/(.6+.4*2/3)*2/64)
directions=np.array(directions,dtype=np.float32);weights=np.array(weights,dtype=np.float32)

def sky_at(points,normals):
    normals=np.broadcast_to(normals,points.shape);p=points+normals*.006
    result=np.zeros(len(points),dtype=np.float32)
    for direction,weight in zip(directions,weights):
        cosine=np.maximum(normals@direction,0);ids=np.flatnonzero(cosine>.00001)
        if len(ids):result[ids]+=weight*cosine[ids]*visible(p[ids],direction)
    return result

sp=[];sn=[];sa=[]
for mesh in meshes.values():
    if mesh['glass'] or mesh['roof']:continue
    vertices=np.array(mesh['positions'],dtype=np.float32).reshape(-1,3)+np.array(mesh['position'],dtype=np.float32)
    normals=np.array(mesh['normals'],dtype=np.float32).reshape(-1,3)
    for face in range(6):
        a,b,c,d=vertices[face*4:face*4+4];width,height=np.linalg.norm(d-c),np.linalg.norm(a-c)
        nx,ny=max(1,int(np.ceil(width/.4))),max(1,int(np.ceil(height/.4)))
        u,v=np.meshgrid((np.arange(nx)+.5)/nx,(np.arange(ny)+.5)/ny)
        points=c+(d-c)*u.ravel()[:,None]+(a-c)*v.ravel()[:,None]
        sp.extend(points);sn.extend([normals[face*4]]*len(points));sa.extend([width*height/(nx*ny)]*len(points))
sp=np.array(sp,dtype=np.float32);sn=np.array(sn,dtype=np.float32);sa=np.array(sa,dtype=np.float32)
owner=owners(sp,sn);energy=sky_at(sp,sn)*sa*np.where(sn[:,1]>.5,.48,.67)
volumes=[];report=[]
for group_id,r in enumerate(groups):
    x=np.linspace(r['x']+.045,r['x']+r['w']-.045,max(3,int(np.ceil(r['w']/.4))+1),dtype=np.float32)
    y=np.linspace(.035,2.765,8,dtype=np.float32)
    z=np.linspace(r['z']+.045,r['z']+r['d']-.045,max(3,int(np.ceil(r['d']/.4))+1),dtype=np.float32)
    yy,zz,xx=np.meshgrid(y,z,x,indexing='ij');points=np.stack([xx.ravel(),yy.ravel(),zz.ravel()],axis=1)
    exposure=np.zeros((len(points),6),dtype=np.float32)
    for direction,weight in zip(directions,weights):exposure+=visible(points,direction)[:,None]*np.maximum(AXES@direction,0)[None,:]*weight
    ids=np.flatnonzero((owner==group_id)&(energy>.00001));flux=float(energy[ids].sum())
    indirect=np.zeros_like(exposure)
    if len(ids):
        count=min(48,len(ids));cdf=np.cumsum(energy[ids]);selected=ids[np.searchsorted(cdf,(np.arange(count)+.5)*flux/count)]
        for emitter in selected:
            delta=sp[emitter]+sn[emitter]*.018-points;length=np.linalg.norm(delta,axis=1);direction=delta/np.maximum(length[:,None],.01)
            cosine=np.maximum(-direction@sn[emitter],0);valid=cosine>.0001;transport=np.zeros(len(points),dtype=np.float32)
            if valid.any():transport[valid]=visible(points[valid],direction[valid],length[valid])
            value=(flux/count)*cosine*transport/(np.pi*(length*length+.16))
            indirect+=np.maximum(direction@AXES.T,0)*value[:,None]
    indirect+=float(indirect.mean())*.16+float(exposure.mean())*.12
    values=np.stack([exposure,indirect,np.zeros_like(exposure)],axis=2).reshape(len(y),len(z),len(x),6,3)
    # Diffuse sky has a broad angular source. Smooth Monte Carlo visibility in
    # each room, without smoothing the separate direct-sun atlas or across walls.
    for repeat in range(2):
        for axis in range(3):
            padding=[(0,0)]*5;padding[axis]=(2,2);padded=np.pad(values,padding,mode='edge')
            values=sum(np.take(padded,np.arange(values.shape[axis])+offset,axis=axis)*weight for offset,weight in enumerate([1/16,4/16,6/16,4/16,1/16]))
    volumes.append({'axes':[x,y,z],'values':values})
    report.append({'room':r['id'],'meanExposure':round(float(exposure.mean()),5),'meanBounce':round(float(indirect.mean()),5),'reflectedFlux':round(flux,5)})
    print(f"sky volume {r['id']} ({time.monotonic()-start:.1f}s)",flush=True)

def shade(points,normals):
    sampled=sample_volume(points,normals,volumes)
    value=sampled[:,0]+sampled[:,1]*1.4
    outdoors=owners(points,normals)<0
    normal=np.broadcast_to(normals,points.shape)
    value[outdoors]=np.clip(normal[outdoors,1]*.5+.5,0,1)
    return value

for index,item in enumerate(data['maps']):
    pixels=np.array(Image.open(BytesIO(base64.b64decode(item['image'].split(',')[1]))).convert('RGB'))[::-1].copy()
    if item['roof']:
        xx,zz=np.meshgrid(np.linspace(-.18,6.38,item['width'],dtype=np.float32),np.linspace(-.18,11.98,item['height'],dtype=np.float32))
        points=np.stack([xx.ravel(),np.full(xx.size,2.8),zz.ravel()],axis=1).astype(np.float32)
        pixels[:,:,0]=np.uint8(np.sqrt(np.clip(shade(points,np.array([0,-1,0],dtype=np.float32)).reshape(item['height'],item['width']),0,1))*255+.5)
    else:
        mesh=meshes[item['id']];vertices=np.array(mesh['positions'],dtype=np.float32).reshape(-1,3)+np.array(mesh['position'],dtype=np.float32)
        normals=np.array(mesh['normals'],dtype=np.float32).reshape(-1,3)
        for face,(x,y,w,h) in enumerate(item['rects']):
            a,b,c,d=vertices[face*4:face*4+4];u,v=np.meshgrid(np.linspace(0,1,w,dtype=np.float32),np.linspace(0,1,h,dtype=np.float32))
            points=c+(d-c)*u.ravel()[:,None]+(a-c)*v.ravel()[:,None]
            values=np.sqrt(np.clip(shade(points,normals[face*4]).reshape(h,w),0,1))
            yy,xx=np.mgrid[:h,:w];dither=((xx*37+yy*17)%101/100-.5)*.65
            image=Image.fromarray(np.uint8(np.clip(values*255+.5+dither,0,255))).filter(ImageFilter.GaussianBlur(.65))
            pixels[y-3:y+h+3,x-3:x+w+3,0]=np.pad(np.asarray(image),((3,3),(3,3)),mode='edge')
    stream=BytesIO();Image.fromarray(pixels[::-1]).save(stream,format='PNG',optimize=True)
    item['image']='data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode('ascii')
    if index%10==0:print(f"sky atlases {index+1}/{len(data['maps'])} ({time.monotonic()-start:.1f}s)",flush=True)
data['skyBake']={'hemisphereSamples':64,'skyModel':'zenith-weighted upper hemisphere','directAndBounce':True,'encoding':'sqrt-irradiance with sub-texel dither','storage':'lamp atlas R; original G/B preserved','rooms':report}
(ROOT/'baked-lighting.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(ROOT.parent/'validation/sky-bake-report.json').write_text(json.dumps(data['skyBake'],ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Completed sky atlases in {time.monotonic()-start:.1f}s',flush=True)
