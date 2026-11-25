"""Bake direct sunlight and diffuse bounce for three Hangzhou solar times.

RGB encodes morning/noon/dusk irradiance, not display colours. Window mullions
and the sealed roof occlude rays. Surfel transport is cached in a per-room
volume and interpolated to UV atlases, avoiding runtime GI and point blotches.
"""
from pathlib import Path
from io import BytesIO
import base64, json, time
import numpy as np
from PIL import Image, ImageFilter
from roof_geometry import roof_bounds, roof_blockers

ROOT=Path(__file__).parent
source=json.loads((ROOT/'bake-source.json').read_text(encoding='utf-8'))
data=json.loads((ROOT/'baked-lighting.json').read_text(encoding='utf-8'))
site=json.loads((ROOT/'solar-presets.json').read_text(encoding='utf-8'))
meshes={m['id']:m for m in source['meshes']}
blockers=[]
for m in meshes.values():
    if m['roof'] or m['glass'] or not m['box']:continue
    size=np.array(m['box'],dtype=np.float32);p=np.array(m['position'],dtype=np.float32)
    blockers.append((p-size/2,p+size/2))
blockers.extend(roof_blockers(source))
blockers=np.array(blockers,dtype=np.float32)
AXES=np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],dtype=np.float32)
start=time.monotonic()

def visible(points,directions,distance=300):
    result=np.ones(len(points),dtype=bool)
    if directions.ndim==1:directions=np.broadcast_to(directions,points.shape)
    inv=np.divide(1,directions,out=np.full_like(directions,1e12),where=np.abs(directions)>1e-8)
    distance=np.broadcast_to(distance,(len(points),))
    for lo,hi in blockers:
        ids=np.flatnonzero(result)
        if not len(ids):break
        a=(lo-points[ids])*inv[ids];b=(hi-points[ids])*inv[ids]
        near=np.maximum(np.minimum(a,b).max(axis=1),.003)
        far=np.minimum(np.maximum(a,b).min(axis=1),distance[ids]-.008)
        result[ids[far>near]]=False
    return result.astype(np.float32)

def direct(points,normals):
    normals=np.broadcast_to(normals,points.shape);p=points+normals*.006
    result=np.zeros((len(p),3),dtype=np.float32)
    for channel,preset in enumerate(site['presets'][:3]):
        sun=np.array(preset['direction'],dtype=np.float32)
        for ox,oz in [(0,0),(-.0045,0),(.0045,0),(0,-.0045),(0,.0045)]:
            d=sun+np.array([ox,0,oz],dtype=np.float32);d/=np.linalg.norm(d)
            cosine=np.maximum(normals@d,0);ids=np.flatnonzero(cosine>.0001)
            if len(ids):result[ids,channel]+=cosine[ids]*visible(p[ids],d)/5
    return result

groups=[]
for room in source['rooms']:
    if room['id'] in ['dining','equipment1','equipment2']:continue
    r=dict(room)
    if r['id']=='living':r.update(w=6.2)
    groups.append(r)

def owners(points,normals):
    p=points+np.broadcast_to(normals,points.shape)*.025
    result=np.full(len(p),-1,dtype=np.int16)
    for i,r in enumerate(groups):
        mask=(result<0)&(p[:,0]>=r['x']-1e-5)&(p[:,0]<=r['x']+r['w']+1e-5)&(p[:,2]>=r['z']-1e-5)&(p[:,2]<=r['z']+r['d']+1e-5)
        result[mask]=i
    return result


def sample_volume(points,normals,volumes):
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
