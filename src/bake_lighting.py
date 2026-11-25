from pathlib import Path
from io import BytesIO
import json, base64, time
import numpy as np
from PIL import Image, ImageFilter
from roof_geometry import roof_bounds, roof_blockers

ROOT=Path(__file__).parent
source=json.loads((ROOT/'bake-source.json').read_text(encoding='utf-8'))
meshes=source['meshes']
rooms=source['rooms']
lamps=[(r['x']+r['w']/2,2.67,r['z']+r['d']/2) for r in rooms if not r['id'].startswith('equipment')]
blockers=[]
for mesh in meshes:
    if mesh['roof'] or mesh['glass'] or not mesh['box']: continue
    size=np.array(mesh['box']);pos=np.array(mesh['position'])
    if np.sort(size)[1]<.12: continue
    blockers.append((pos-size/2,pos+size/2))
# Continuous closed roof, including a 160 mm overlap with the wall tops.
blockers.extend(roof_blockers(source))
blockers=np.array(blockers,dtype=np.float32)

def visibility(points,directions,distance):
    n=len(points); result=np.ones(n,dtype=bool)
    if np.ndim(directions)==1: directions=np.broadcast_to(directions,points.shape)
    inv=np.divide(1,directions,out=np.full_like(directions,1e12),where=np.abs(directions)>1e-8)
    distance=np.broadcast_to(distance,(n,))
    for lo,hi in blockers:
        if not result.any():break
        ids=np.flatnonzero(result)
        origin=points[ids]; iv=inv[ids]
        a=(lo-origin)*iv;b=(hi-origin)*iv
        near=np.maximum(np.minimum(a,b).max(axis=1),.003)
        far=np.minimum(np.maximum(a,b).min(axis=1),distance[ids]-.003)
        result[ids[far>near]]=False
    return result.astype(np.float32)

sun=np.array([-9,8,7],dtype=np.float32);sun/=np.linalg.norm(sun)

def calculate(points,normals):
    p=points+normals*.006
    daylight=np.zeros(len(p),dtype=np.float32)
    for offset in [(-.018,0),(0,-.018),(0,0),(0,.018),(.018,0)]:
        d=sun+np.array([offset[0],0,offset[1]],dtype=np.float32);d/=np.linalg.norm(d)
        cosine=np.maximum(normals@d,0)
        ids=np.flatnonzero(cosine>.001)
        if len(ids):daylight[ids]+=cosine[ids]*visibility(p[ids],d,60)/5
    direct=np.zeros(len(p),dtype=np.float32)
    bounce=np.zeros(len(p),dtype=np.float32)
    sample=points+normals*.025
    owner=np.full(len(p),-1,dtype=np.int16)
    for ri,r in enumerate(rooms):
        mask=(owner<0)&(sample[:,0]>=r['x']-1e-5)&(sample[:,0]<=r['x']+r['w']+1e-5)&(sample[:,2]>=r['z']-1e-5)&(sample[:,2]<=r['z']+r['d']+1e-5)
        owner[mask]=ri
    for ri,r in enumerate(rooms):
        if r['id'].startswith('equipment'):continue
        connected=[ri]
        if r['id'] in ['living','dining']:connected=[i for i,v in enumerate(rooms) if v['id'] in ['living','dining']]
        ids=np.flatnonzero(np.isin(owner,connected))
        if len(ids):
            # An area emitter softens contact shadows. Light-to-surface is downward,
            # hence surface-to-light has a positive y component below the fixture.
            for ox,oz in [(0,0),(-.13,-.13),(-.13,.13),(.13,-.13),(.13,.13)]:
                light=np.array([r['x']+r['w']/2+ox,2.67,r['z']+r['d']/2+oz],dtype=np.float32)
                delta=light-p[ids];length=np.linalg.norm(delta,axis=1);direction=delta/np.maximum(length[:,None],.01)
                downward=np.maximum(direction[:,1],0)
                cosine=np.maximum(np.sum(normals[ids]*direction,axis=1),0)
                valid=(cosine>.001)&(downward>.001)
                target=ids[valid]
                if len(target):direct[target]+=cosine[valid]*downward[valid]*3.5/(.7+length[valid]**2)*visibility(p[target],direction[valid],length[valid])/5
        # Diffuse bounce is a smooth field within the receiving room. It has no
        # hard point-light range or doorway visibility edges, which caused the old blotches.
        mask=owner==ri
        if not mask.any():continue
        x,z,w,d=r['x'],r['z'],r['w'],r['d']
        if r['id'] in ['living','dining']:x,z,w,d=0,2.9,6.2,3.5
        dx=(points[mask,0]-x-w/2)/(w*.68);dz=(points[mask,2]-z-d/2)/(d*.68)
        profile=np.exp(-(dx*dx+dz*dz)*1.3)
        n=normals[mask]
        values=np.where(n[:,1]<-.5,.17+.31*profile,np.where(n[:,1]>.5,.12+.08*profile,.18+.09*profile))
        bounce[mask]=values
    return np.stack([np.minimum(daylight,1),np.minimum(direct/2,1),np.minimum(bounce,1)],axis=1)

maps=[];start=time.monotonic()
for mesh in meshes:
    if mesh['glass']:continue
    if not mesh['roof'] and np.sort(mesh['box'])[1]<.12:continue
    if mesh['roof']:
        min_x,min_z,max_x,max_z=roof_bounds(source)
        width,height=640,round((max_z-min_z)*100)
        xx=np.linspace(min_x,max_x,width,dtype=np.float32)
        zz=np.linspace(min_z,max_z,height,dtype=np.float32)
        x,z=np.meshgrid(xx,zz)
        points=np.stack([x.ravel(),np.full(x.size,2.8),z.ravel()],axis=1).astype(np.float32)
        normals=np.tile(np.array([0,-1,0],dtype=np.float32),(len(points),1))
        pixels=calculate(points,normals).reshape(height,width,3)
    else:
        vertices=np.array(mesh['positions'],dtype=np.float32).reshape(-1,3)+np.array(mesh['position'],dtype=np.float32)
        normals=np.array(mesh['normals'],dtype=np.float32).reshape(-1,3)
        rectangles=[];shelf_x=shelf_y=shelf_h=0
        for face in range(6):
            a,b,c,d=vertices[face*4:face*4+4]
            fw=min(1024,max(8,int(np.ceil(np.linalg.norm(d-c)*96))))
            fh=min(1024,max(8,int(np.ceil(np.linalg.norm(a-c)*96))))
            if shelf_x+fw+6>1030:shelf_y+=shelf_h;shelf_x=shelf_h=0
            rectangles.append([shelf_x+3,shelf_y+3,fw,fh])
            shelf_x+=fw+6;shelf_h=max(shelf_h,fh+6)
        width=max(rect[0]+rect[2]+3 for rect in rectangles);height=shelf_y+shelf_h
        pixels=np.zeros((height,width,3),dtype=np.float32)
        for face in range(6):
            a,b,c,d=vertices[face*4:face*4+4];normal=normals[face*4]
            xx,yy,fw,fh=rectangles[face]
            u,v=np.meshgrid(np.linspace(0,1,fw,dtype=np.float32),np.linspace(0,1,fh,dtype=np.float32))
            points=(c[None,:]+(d-c)[None,:]*u.ravel()[:,None]+(a-c)[None,:]*v.ravel()[:,None])
            values=calculate(points,np.tile(normal,(len(points),1))).reshape(fh,fw,3)
            # Filter each face independently so shadow texels blend without atlas bleeding.
            values=np.asarray(Image.fromarray(np.uint8(np.clip(values*255,0,255))).filter(ImageFilter.GaussianBlur(.85)),dtype=np.float32)/255
            pixels[yy-3:yy+fh+3,xx-3:xx+fw+3]=np.pad(values,((3,3),(3,3),(0,0)),mode='edge')
    # UV y=0 is the bottom of a texture; HTML image sources begin at the top.
    image=Image.fromarray(np.uint8(np.clip(pixels[::-1]*255,0,255)))
    stream=BytesIO();image.save(stream,format='PNG',optimize=True)
    item={'id':mesh['id'],'roof':mesh['roof'],'width':width,'height':height,'image':'data:image/png;base64,'+base64.b64encode(stream.getvalue()).decode('ascii')}
    if not mesh['roof']:item['rects']=rectangles
    maps.append(item)
    print(f"baked mesh {mesh['id']} ({len(maps)} maps, {time.monotonic()-start:.1f}s)",flush=True)
(ROOT/'baked-lighting.json').write_text(json.dumps({'maps':maps},separators=(',',':')),encoding='utf-8')
print(f'Baked {len(maps)} maps in {time.monotonic()-start:.1f}s')
