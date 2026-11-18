"""Bake direct sunlight and diffuse bounce for three Hangzhou solar times.

RGB encodes morning/noon/dusk irradiance, not display colours. Window mullions
and the sealed roof occlude rays. Surfel transport is cached in a per-room
volume and interpolated to UV atlases, avoiding runtime GI and point blotches.
"""
from pathlib import Path
from io import BytesIO
import base64, json, time, sys
import numpy as np
from PIL import Image, ImageFilter

from daylight_transport import ROOT, source, data, site, meshes, blockers, AXES, start, visible, direct, groups, owners

surfel_p=[];surfel_n=[];surfel_a=[]
for mesh in meshes.values():
    if mesh['glass'] or mesh['roof']:continue
    vertices=np.array(mesh['positions'],dtype=np.float32).reshape(-1,3)+np.array(mesh['position'],dtype=np.float32)
    normals=np.array(mesh['normals'],dtype=np.float32).reshape(-1,3)
    for face in range(6):
        a,b,c,d=vertices[face*4:face*4+4]
        width,height=np.linalg.norm(d-c),np.linalg.norm(a-c)
        nx,ny=max(1,int(np.ceil(width/.35))),max(1,int(np.ceil(height/.35)))
        u,v=np.meshgrid((np.arange(nx)+.5)/nx,(np.arange(ny)+.5)/ny)
        points=c+(d-c)*u.ravel()[:,None]+(a-c)*v.ravel()[:,None]
        surfel_p.extend(points);surfel_n.extend([normals[face*4]]*len(points));surfel_a.extend([width*height/(nx*ny)]*len(points))
surfel_p=np.array(surfel_p,dtype=np.float32);surfel_n=np.array(surfel_n,dtype=np.float32);surfel_a=np.array(surfel_a,dtype=np.float32)
surfel_owner=owners(surfel_p,surfel_n)
surfel_energy=direct(surfel_p,surfel_n)*surfel_a[:,None]*np.where(surfel_n[:,1]>.5,.48,.67)[:,None]
volumes=[];report=[]
for group_id,r in enumerate(groups):
    x=np.linspace(r['x']+.045,r['x']+r['w']-.045,max(3,int(np.ceil(r['w']/.48))+1),dtype=np.float32)
    y=np.linspace(.035,2.765,7,dtype=np.float32)
    z=np.linspace(r['z']+.045,r['z']+r['d']-.045,max(3,int(np.ceil(r['d']/.48))+1),dtype=np.float32)
    yy,zz,xx=np.meshgrid(y,z,x,indexing='ij');points=np.stack([xx.ravel(),yy.ravel(),zz.ravel()],axis=1)
    irradiance=np.zeros((len(points),6,3),dtype=np.float32);room_flux=[]
    for channel in range(3):
        ids=np.flatnonzero((surfel_owner==group_id)&(surfel_energy[:,channel]>.00002))
        flux=float(surfel_energy[ids,channel].sum());room_flux.append(round(flux,5))
        if not len(ids):continue
        # Deterministic importance samples retain the total reflected flux.
        count=min(40,len(ids));cdf=np.cumsum(surfel_energy[ids,channel])
        selected=ids[np.searchsorted(cdf,(np.arange(count)+.5)*flux/count)]
        for emitter in selected:
            delta=surfel_p[emitter]+surfel_n[emitter]*.018-points
            length=np.linalg.norm(delta,axis=1);direction=delta/np.maximum(length[:,None],.01)
            cosine=np.maximum(-direction@surfel_n[emitter],0);valid=cosine>.0001
            transport=np.zeros(len(points),dtype=np.float32)
            if valid.any():transport[valid]=visible(points[valid],direction[valid],length[valid])
            energy=(flux/count)*cosine*transport/(np.pi*(length*length+.16))
            irradiance[:,:,channel]+=np.maximum(direction@AXES.T,0)*energy[:,None]
        irradiance[:,:,channel]+=float(irradiance[:,:,channel].mean())*.16
    volumes.append({'axes':[x,y,z],'values':irradiance.reshape(len(y),len(z),len(x),6,3)})
    report.append({'room':r['id'],'reflectedFlux':room_flux,'grid':[len(x),len(y),len(z)]})
    print(f"bounce volume {r['id']} ({time.monotonic()-start:.1f}s)",flush=True)

def bounce(points,normals):
    normals=np.broadcast_to(normals,points.shape);result=np.zeros((len(points),3),dtype=np.float32)
    owner=owners(points,normals);normal_axis=np.argmax(normals@AXES.T,axis=1)
    for group_id,volume in enumerate(volumes):
        ids=np.flatnonzero(owner==group_id)
        if not len(ids):continue
        coords=[]
        for axis,coordinates in enumerate(volume['axes']):
            coordinate=np.clip((points[ids,axis]-coordinates[0])/(coordinates[-1]-coordinates[0])*(len(coordinates)-1),0,len(coordinates)-1.00001)
            lo=coordinate.astype(np.int32);coords.append((lo,coordinate-lo))
        ix,tx=coords[0];iy,ty=coords[1];iz,tz=coords[2]
        for dx in [0,1]:
            for dy in [0,1]:
                for dz in [0,1]:
                    weight=(tx if dx else 1-tx)*(ty if dy else 1-ty)*(tz if dz else 1-tz)
                    result[ids]+=volume['values'][iy+dy,iz+dz,ix+dx,normal_axis[ids]]*weight[:,None]
    return result

def encode(pixels,scale,compand=False):
    values=np.sqrt(np.clip(pixels,0,1)) if compand else pixels
    image=Image.fromarray(np.uint8(np.clip(values[::-1]*255+.5,0,255)))
    if scale!=1:image=image.resize((max(1,round(image.width*scale)),max(1,round(image.height*scale))),Image.Resampling.LANCZOS)
    stream=BytesIO();image.save(stream,format='PNG',optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode('ascii')

bounce_only='--bounce-only' in sys.argv
for index,item in enumerate(data['maps']):
    sunlight=np.zeros((item['height'],item['width'],3),dtype=np.float32);indirect=np.zeros_like(sunlight)
    if item['roof']:
        xx,zz=np.meshgrid(np.linspace(-.18,6.38,item['width'],dtype=np.float32),np.linspace(-.18,11.98,item['height'],dtype=np.float32))
        points=np.stack([xx.ravel(),np.full(xx.size,2.8),zz.ravel()],axis=1).astype(np.float32)
        indirect=bounce(points,np.array([0,-1,0],dtype=np.float32)).reshape(indirect.shape)
        item['sunImage']=encode(np.zeros((1,1,3),dtype=np.float32),1)
    else:
        mesh=meshes[item['id']]
        vertices=np.array(mesh['positions'],dtype=np.float32).reshape(-1,3)+np.array(mesh['position'],dtype=np.float32)
        normals=np.array(mesh['normals'],dtype=np.float32).reshape(-1,3)
        for face,(x,y,w,h) in enumerate(item['rects']):
            a,b,c,d=vertices[face*4:face*4+4]
            u,v=np.meshgrid(np.linspace(0,1,w,dtype=np.float32),np.linspace(0,1,h,dtype=np.float32))
            points=c+(d-c)*u.ravel()[:,None]+(a-c)*v.ravel()[:,None]
            if not bounce_only:
                values=direct(points,normals[face*4]).reshape(h,w,3)
                image=Image.fromarray(np.uint8(np.clip(values*255+.5,0,255))).filter(ImageFilter.GaussianBlur(.55))
                sunlight[y-3:y+h+3,x-3:x+w+3]=np.pad(np.asarray(image,dtype=np.float32)/255,((3,3),(3,3),(0,0)),mode='edge')
            values=bounce(points,normals[face*4]).reshape(h,w,3)
            indirect[y-3:y+h+3,x-3:x+w+3]=np.pad(values,((3,3),(3,3),(0,0)),mode='edge')
        if not bounce_only:item['sunImage']=encode(sunlight,.9)
    item['sunBounceImage']=encode(indirect,.4,True)
    if index%10==0:print(f"solar atlases {index+1}/{len(data['maps'])} ({time.monotonic()-start:.1f}s)",flush=True)
data['solarSite']=site
data['solarBake']={'version':2,'times':[p['time'] for p in site['presets'][:3]],'direct':'5 solar disk rays per texel; mullions and sealed roof','bounce':'diffuse surfels, 40 importance samples, per-room trilinear irradiance volume','bounceEncoding':'sqrt-irradiance','channels':['morning','noon','dusk'],'blockers':len(blockers),'rooms':report}
(ROOT/'baked-lighting.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(ROOT.parent/'validation/solar-bake-report.json').write_text(json.dumps(data['solarBake'],ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Completed solar atlases in {time.monotonic()-start:.1f}s',flush=True)
