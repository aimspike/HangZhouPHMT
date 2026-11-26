"""Check real exported surface separation; run with Blender's Python.

The audit retains authored part ranges through runtime material merging. Normal
rays find same-facing near-coplanar surface candidates. It samples triangle
centres, not every possible self-intersection. Authored solid ranges identify
the rebuilt asset types; procedural pieces with a shared label and hidden
structural contact are not an exhaustive intersection audit. Exact closure is
checked elsewhere.
"""
from pathlib import Path
import json,gzip,os
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
report={'scope':__doc__,'toleranceMm':.4,'cases':{},'result':'pending'}
for stage in ['before','after']:
    source=Path(os.environ.get('AUDIT_'+stage.upper(),str(ROOT/f'work/exposure-overlap/{stage}-audit.json.gz')))
    scene=json.loads(gzip.decompress(source.read_bytes()))
    report['cases'][stage]={}
    for lod,objects in scene['layouts'].items():
        vertices=[];triangles=[];labels=[];decor=[];transparent=[];partBounds={}
        for o in objects:
            offset=len(vertices);vertices.extend(np.array(o['positions']).reshape(-1,3).tolist());ids=np.array(o['indices']).reshape(-1,3)
            ranges=o['parts'] or [{'name':o['path'], 'start':0,'count':ids.size}]
            for part in ranges:
                selected=np.array(o['positions']).reshape(-1,3)[ids[part['start']//3:(part['start']+part['count'])//3].flatten()]
                label=o['path']+' / '+part['name'];partBounds.setdefault(label,{'min':selected.min(axis=0),'max':selected.max(axis=0)})
                for t in ids[part['start']//3:(part['start']+part['count'])//3]:
                    labels.append(label);decor.append('-furniture' in o['path']);transparent.append(all(m['transparent'] for m in o['materials']));triangles.append((t+offset).tolist())
        points=np.array(vertices);tris=np.array(triangles);p=points[tris];cross=np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]);length=np.linalg.norm(cross,axis=1);normals=cross/np.maximum(length[:,None],1e-12);centres=p.mean(axis=1)
        bvh=BVHTree.FromPolygons([Vector(v) for v in vertices],triangles,all_triangles=True)
        pairs={};tests=0
        for i,centre in enumerate(centres):
            if not decor[i] or transparent[i] or length[i]<1e-8:continue
            tests+=1;normal=Vector(normals[i]);hit,_,j,_=bvh.ray_cast(Vector(centre)+normal*.008,-normal,.009)
            if hit is None or j==i or labels[i]==labels[j] or transparent[j] or normals[i].dot(normals[j])<.998:continue
            separation=abs((hit-Vector(centre)).dot(normal))
            if separation>.0004:continue
            key=tuple(sorted([labels[i],labels[j]]));r=pairs.setdefault(key,{'samples':0,'sampledTriangleArea':0,'maxSeparationMm':0});r['samples']+=1;r['sampledTriangleArea']+=float(length[i]/2);r['maxSeparationMm']=max(r['maxSeparationMm'],separation*1000)
        east=next(v for k,v in partBounds.items() if k.endswith('kitchen-east / stone worktop'))
        if stage=='before':northEnd=max(v['max'][0] for k,v in partBounds.items() if 'kitchen-north / counter end' in k)
        else:northEnd=next(v['max'][0] for k,v in partBounds.items() if k.endswith('kitchen-north / single opening countertop'))
        join=(east['min'][0]-northEnd)*1000
        result={'triangles':len(tris),'furnitureSurfaceSamples':tests,'nearCoplanarPairs':[{'a':a,'b':b,**v} for (a,b),v in pairs.items()],'kitchenCounterJoinMm':float(join)}
        report['cases'][stage][lod]=result
        if stage=='after':
            assert not pairs,(lod,list(pairs))
            assert abs(join)<.15,('counter join',join)
        print(stage,lod,'near-coplanar furniture pairs',len(pairs),'counter join mm',join,flush=True)
for lod in ['high','mobile']:
    assert len(report['cases']['before'][lod]['nearCoplanarPairs'])>=10
    assert report['cases']['before'][lod]['kitchenCounterJoinMm']< -20
report['result']='passed'
Path(os.environ.get('OVERLAP_REPORT',str(ROOT/'validation/exposed-overlap.json'))).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
